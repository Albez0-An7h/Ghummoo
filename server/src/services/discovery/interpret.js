/* Natural-language → structured preferences.

   The rule-based parser (prefs.parseQuery) always runs and is the fallback. When an AI provider
   is configured, the model extracts the same fields; anything that would act as a hard filter
   is accepted only if it is grounded in the user's own words, so the model can't invent a
   budget, city, length or date. The model never sees or returns trips. */
const { callStructured, getConfig } = require('../ai/provider');
const { MOOD_KEYS, BUDGETS, DURATIONS, parseQuery, normalisePrefs } = require('./prefs');

const SCHEMA = {
  type: 'object',
  properties: {
    moods: { type: 'array', items: { type: 'string', enum: MOOD_KEYS } },
    interests: { type: 'array', items: { type: 'string' }, description: 'Activities named by the user, e.g. trekking, camping' },
    budget: { type: ['string', 'null'], enum: [...Object.keys(BUDGETS), null] },
    maxPrice: { type: ['number', 'null'], description: 'Maximum price per person in INR, only if the user gave a number' },
    affordable: { type: 'boolean', description: 'User asked for cheap/affordable without a number' },
    duration: { type: ['string', 'null'], enum: [...Object.keys(DURATIONS), null] },
    days: { type: ['integer', 'null'], description: 'Trip length in days, only if the user gave a number' },
    departureCity: { type: ['string', 'null'], description: 'City the user wants to start from, exactly as written' },
    destination: { type: ['string', 'null'], description: 'Place the user wants to go, exactly as written' },
    dates: {
      type: ['object', 'null'],
      properties: { mode: { type: 'string', enum: ['flexible', 'weekend', 'range'] }, from: { type: ['string', 'null'] }, to: { type: ['string', 'null'] } },
    },
    ambiguities: { type: 'array', items: { type: 'string' }, description: 'Short notes on anything unclear. Empty if clear.' },
  },
  required: ['moods', 'interests', 'budget', 'maxPrice', 'affordable', 'duration', 'days', 'departureCity', 'destination', 'dates', 'ambiguities'],
};

function systemPrompt(now) {
  return `You turn a traveller's request for a group trip in India into search preferences. Today is ${now.toISOString().slice(0, 10)}.
Rules:
- Extract only what the traveller said. Use null or [] when something isn't mentioned. Never guess a budget, city, length or dates.
- moods: pick from ${MOOD_KEYS.join(', ')} only when the request clearly implies them.
- maxPrice: a number in rupees per person only if a figure is given ("8k" = 8000). "Affordable" or "cheap" without a figure means affordable=true and maxPrice=null.
- days: only if a number of days or nights is given (N nights = N+1 days).
- dates: "this/next weekend" = {"mode":"weekend"}; a month or specific dates = {"mode":"range","from":"YYYY-MM-DD","to":"YYYY-MM-DD"} using the next future occurrence; otherwise null.
- departureCity and destination: copy the place name as written, or null.
- ambiguities: at most 2 short notes, only for things that genuinely change the search. Do not ask questions.
- You do not know which trips exist. Never mention trips, prices of trips or availability.`;
}

const lc = (s) => String(s || '').toLowerCase();
const digitsIn = (text) => lc(text).replace(/[,\s]/g, '');
const numberGrounded = (n, text) => n != null && (digitsIn(text).includes(String(n)) || lc(text).includes(`${n / 1000}k`));
// Evidence that the user actually mentioned dates: a weekend, next month, or a month name.
const DATE_WORDS = /\bweekend\b|\bnext month\b|\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)\b|\d{1,2}[/-]\d{1,2}/i;

function resolvePlace(name, places, onlyCities) {
  if (!name) return null;
  const f = lc(name).trim();
  const pool = onlyCities ? places.filter((p) => p.kind === 'city') : places;
  const hit = pool.find((p) => [p.name, ...(p.aliases || [])].some((n) => lc(n) === f));
  return hit ? { slug: hit.slug, name: hit.name } : { text: String(name).trim().replace(/\b\w/g, (ch) => ch.toUpperCase()) };
}

/* Applies the grounding rules to raw model output. Returns preferences plus notes on anything
   that was dropped. */
function groundAiPrefs(ai, text, places) {
  const dropped = [];
  const raw = {
    moods: ai.moods,
    interests: (ai.interests || []).filter((i) => lc(text).includes(lc(i).slice(0, 4))),
    affordable: ai.affordable === true,
    duration: ai.duration,
    budget: ai.budget,
  };
  if (ai.maxPrice != null) { if (numberGrounded(ai.maxPrice, text)) raw.maxPrice = ai.maxPrice; else dropped.push('budget'); }
  if (ai.days != null) {
    if (numberGrounded(ai.days, text) || numberGrounded(ai.days - 1, text)) raw.days = ai.days; else dropped.push('days');
  }
  // A budget band needs money words in the request (a bare "3" in "3 days" is not a budget).
  if (ai.budget && ai.budget !== 'flexible' && !/(₹|\brs\.?\b|\binr\b|budget|cheap|afford|price|cost|spend|lakh|thousand|luxur|premium|splurge|\d\s*k\b|\d{4,})/i.test(text)) { raw.budget = undefined; dropped.push('budget band'); }
  if (ai.duration && ai.duration !== 'flexible' && !/(day|night|week|weekend)/i.test(text)) { raw.duration = undefined; dropped.push('duration'); }
  if (ai.departureCity) { if (lc(text).includes(lc(ai.departureCity))) raw.departureCity = resolvePlace(ai.departureCity, places, true); else dropped.push('departure city'); }
  if (ai.destination) { if (lc(text).includes(lc(ai.destination))) raw.destination = resolvePlace(ai.destination, places, false); else dropped.push('destination'); }
  if (ai.dates && ai.dates.mode !== 'flexible') { if (DATE_WORDS.test(text)) raw.dates = ai.dates; else dropped.push('dates'); }
  return { prefs: normalisePrefs(raw), dropped };
}

/* Returns { prefs, ambiguities, mode: 'ai'|'basic', notice? }. Never throws for AI problems. */
async function interpret(text, { places = [], now = new Date() } = {}) {
  const basic = parseQuery(text, { places, now });
  if (!getConfig()) return { ...basic, mode: 'basic', aiAvailable: false };
  try {
    const { data } = await callStructured({
      system: systemPrompt(now),
      user: `Traveller's request:\n"""${String(text).slice(0, 500)}"""`,
      schema: SCHEMA,
      name: 'record_preferences',
      maxTokens: 600,
      timeoutMs: Number(process.env.AI_DISCOVERY_TIMEOUT_MS) || 12000,
    });
    const { prefs, dropped } = groundAiPrefs(data, text, places);
    // Deterministic matches fill any hard field the model left out (they come from the text).
    for (const k of ['maxPrice', 'days', 'departureCity', 'dates']) if (prefs[k] == null && basic.prefs[k] != null) prefs[k] = basic.prefs[k];
    if (!prefs.moods && basic.prefs.moods) prefs.moods = basic.prefs.moods;
    if (!prefs.interests && basic.prefs.interests) prefs.interests = basic.prefs.interests;
    const notes = [
      ...basic.ambiguities,
      ...(data.ambiguities || []).slice(0, 2).map((m) => ({ field: null, message: String(m).slice(0, 200) })),
    ];
    if (dropped.length) notes.push({ field: null, message: `Ignored a ${dropped.join(', ')} that wasn't in your words.` });
    return { prefs: normalisePrefs(prefs), ambiguities: notes.slice(0, 4), mode: 'ai', aiAvailable: true };
  } catch (err) {
    return {
      ...basic,
      mode: 'basic',
      aiAvailable: true,
      aiError: err.code || 'AI_PROVIDER_ERROR',
      notice: err.code === 'AI_RATE_LIMITED'
        ? 'Our AI helper is busy, so we read your request with simple rules. Check the filters below.'
        : 'Our AI helper is unavailable right now, so we read your request with simple rules. Check the filters below.',
    };
  }
}

module.exports = { interpret, groundAiPrefs, SCHEMA };
