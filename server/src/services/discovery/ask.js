/* Ask This Trip: answers questions about one published package using only that package's own
   data. With an AI provider the model answers from a JSON copy of the listing and must cite
   fields; the server then checks the citation and every number against the cited fields.
   Anything that fails a check, and anything the listing doesn't cover, gets the fixed reply
   NOT_CONFIRMED. Without a key (or if the provider fails) a keyword matcher answers instead. */
const { callStructured, getConfig } = require('../ai/provider');
const { presentDeparture, isVerified } = require('../trips');
const { istDay } = require('./prefs');

const NOT_CONFIRMED = "This detail hasn't been confirmed by the organiser.";

// Listing sections an answer may cite, with the UI anchor on the trip page.
const SOURCES = {
  overview: { label: 'Overview', anchor: 'overview' },
  itinerary: { label: 'Itinerary', anchor: 'itinerary' },
  inclusions: { label: 'Inclusions', anchor: 'inclusions' },
  exclusions: { label: 'Exclusions', anchor: 'inclusions' },
  accommodation: { label: 'Accommodation', anchor: 'stay' },
  transport: { label: 'Transport', anchor: 'stay' },
  meals: { label: 'Meals', anchor: 'stay' },
  pickup: { label: 'Pickup', anchor: 'policy' },
  cancellation: { label: 'Cancellation policy', anchor: 'policy' },
  departures: { label: 'Departures', anchor: 'policy' },
  group_size: { label: 'Group size', anchor: 'overview' },
  organiser: { label: 'Organiser', anchor: 'organiser' },
};
const SOURCE_KEYS = Object.keys(SOURCES);

const empty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(empty));

/* The only data the answer may use. Public listing fields; no bookings, no travellers. */
function buildContext(pkg, departures, operator) {
  return {
    title: pkg.title,
    overview: [pkg.summary, pkg.overview, ...(pkg.highlights || [])].filter(Boolean).join('\n'),
    itinerary: (pkg.itinerary || []).map((d) => ({ day: d.day, title: d.title, description: d.description, meals: d.meals, stay: d.stay })),
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    accommodation: pkg.accommodation || '',
    transport: pkg.transport || '',
    meals: pkg.meals || '',
    pickup: [pkg.pickupInfo, ...departures.filter((d) => d.pickupPoint || d.reportingTime).map((d) => `${istDay(d.startDate)}: ${[d.pickupPoint, d.reportingTime && `reporting ${d.reportingTime}`].filter(Boolean).join(', ')}`)].filter(Boolean).join('\n'),
    cancellation: pkg.cancellationPolicy || '',
    departures: departures.map((d) => {
      const p = presentDeparture(d);
      return { start: istDay(p.startDate), end: istDay(p.endDate), pricePerPerson: p.price, currency: pkg.currency, seatsLeft: p.seatsAvailable, availability: p.availability };
    }),
    group_size: pkg.groupSize || '',
    organiser: operator ? { name: operator.businessName, location: operator.location, about: operator.description, foundedYear: operator.foundedYear, verifiedByGhumo: isVerified(operator) } : {},
  };
}

const notConfirmed = (mode, extra = {}) => ({ answered: false, answer: NOT_CONFIRMED, sources: [], mode, ...extra });
const cite = (keys) => keys.map((k) => ({ key: k, ...SOURCES[k] }));

/* ----------------------------- keyword mode ------------------------------ */

const TOPICS = [
  { keys: ['food', 'meal', 'breakfast', 'lunch', 'dinner', 'eat', 'veg'], field: 'meals' },
  { keys: ['stay', 'hotel', 'room', 'sleep', 'accommodation', 'tent', 'sharing', 'camp'], field: 'accommodation' },
  { keys: ['transport', 'bus', 'travel by', 'car', 'train', 'vehicle', 'drive', 'flight', 'volvo'], field: 'transport' },
  { keys: ['pickup', 'pick up', 'meeting point', 'where do we meet', 'start point', 'reporting', 'report'], field: 'pickup' },
  { keys: ['cancel', 'refund'], field: 'cancellation' },
  { keys: ['exclude', 'not included', "isn't included", 'extra cost', 'pay extra', 'extra'], field: 'exclusions' },
  { keys: ['include', 'included', 'covers', 'cover'], field: 'inclusions' },
  { keys: ['price', 'cost', 'seat', 'available', 'availability', 'date', 'when', 'departure'], field: 'departures' },
  { keys: ['group size', 'how many people', 'group'], field: 'group_size' },
  { keys: ['organiser', 'organizer', 'operator', 'who runs', 'company'], field: 'organiser' },
  { keys: ['day', 'itinerary', 'plan', 'schedule'], field: 'itinerary' },
];
const hit = (q, k) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(q);

function formatField(field, v) {
  if (field === 'departures') return v.map((d) => `${d.start}: ₹${Number(d.pricePerPerson).toLocaleString('en-IN')} per person, ${d.availability === 'available' ? `${d.seatsLeft} seats left` : d.availability.replace('_', ' ')}`).join('; ');
  if (field === 'itinerary') return v.map((d) => `Day ${d.day}: ${d.title}`).join('; ');
  if (field === 'organiser') return [v.name, v.location && `based in ${v.location}`, v.foundedYear && `running trips since ${v.foundedYear}`, v.verifiedByGhumo ? 'verified by Ghumo' : 'not yet verified by Ghumo'].filter(Boolean).join(', ');
  return Array.isArray(v) ? v.join('; ') : String(v);
}

function askBasic(context, question) {
  const q = ` ${String(question || '').toLowerCase()} `;
  const topic = TOPICS.find((t) => t.keys.some((k) => hit(q, k)));
  // Safety and other promises are never inferred.
  if (!topic || /\bsafe|safety|secure|women|solo female|guarantee/.test(q)) return notConfirmed('basic');
  const v = context[topic.field];
  if (empty(v)) return notConfirmed('basic');
  return { answered: true, answer: formatField(topic.field, v), sources: cite([topic.field]), mode: 'basic' };
}

/* ------------------------------- AI mode -------------------------------- */

const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answered: { type: 'boolean', description: 'false when the listing does not contain the answer' },
    answer: { type: 'string', description: 'At most 3 short sentences, using only the listing' },
    sources: { type: 'array', items: { type: 'string', enum: SOURCE_KEYS }, description: 'Listing fields the answer is taken from' },
  },
  required: ['answered', 'answer', 'sources'],
};

const SYSTEM = `You answer a traveller's question about ONE group trip, using ONLY the JSON listing provided.
Rules:
- If the listing does not clearly contain the answer, set answered=false. Do not use general knowledge about the destination.
- Never infer or promise safety, availability, meals, transport, accommodation or refunds beyond the exact words in the listing.
- Seats and dates come only from "departures". Prices are per person in the listing's currency.
- Cite every listing field you used in "sources" (keys: ${SOURCE_KEYS.join(', ')}).
- Keep it short and plain. Do not add advice, opinions or marketing language.`;

const numbers = (s) => (String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n) => n.replace(/,/g, ''));
const PROMISES = /\b(guarantee[ds]?|definitely|certainly|100%|completely safe|perfectly safe|totally safe|always safe|fully refundable)\b/i;

/* Server-side checks on a model answer. Returns the answer, or null if it must be replaced. */
function checkAiAnswer(data, context) {
  if (!data.answered) return null;
  const keys = [...new Set(data.sources)].filter((k) => SOURCE_KEYS.includes(k));
  if (!keys.length || keys.some((k) => empty(context[k]))) return null;
  const cited = keys.map((k) => JSON.stringify(context[k])).join(' ').replace(/,(?=\d{3})/g, '');
  if (numbers(data.answer).some((n) => !cited.includes(n))) return null;
  const promise = data.answer.match(PROMISES);
  if (promise && !cited.toLowerCase().includes(promise[0].toLowerCase())) return null;
  const answer = data.answer.trim().slice(0, 600);
  return answer ? { answered: true, answer, sources: cite(keys), mode: 'ai' } : null;
}

async function askTrip(context, question) {
  if (!getConfig()) return { ...askBasic(context, question), aiAvailable: false };
  try {
    const { data } = await callStructured({
      system: SYSTEM,
      user: `Listing (JSON):\n${JSON.stringify(context)}\n\nQuestion: ${String(question).slice(0, 300)}`,
      schema: ANSWER_SCHEMA,
      name: 'answer_question',
      maxTokens: 400,
      timeoutMs: Number(process.env.AI_DISCOVERY_TIMEOUT_MS) || 12000,
    });
    return { ...(checkAiAnswer(data, context) || notConfirmed('ai')), aiAvailable: true };
  } catch (err) {
    return {
      ...askBasic(context, question),
      aiAvailable: true,
      aiError: err.code || 'AI_PROVIDER_ERROR',
      notice: 'Our AI helper is unavailable right now, so this answer comes from matching your question to the listing.',
    };
  }
}

module.exports = { askTrip, askBasic, buildContext, checkAiAnswer, NOT_CONFIRMED, SOURCES };
