/* Pure discovery helpers shared by the live app and the prototype. No React, no I/O, so they
   run under `node --test` (client/test/discovery.test.js).

   Honesty rules: every result is a card the caller passed in, every reason is assembled from
   that card's own fields, and missing data is reported as missing. */

/* Place search for suggestions: name/alias prefix first, then substring or state match. */
export function searchPlaces(places, query, limit = 8) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return places
    .map((p) => {
      const names = [p.name, ...(p.aliases || [])].map((n) => n.toLowerCase());
      const score = names.some((n) => n.startsWith(q)) ? 2 : names.some((n) => n.includes(q)) || (p.state || '').toLowerCase().includes(q) ? 1 : 0;
      return { p, score };
    })
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score || Number(b.p.featured) - Number(a.p.featured) || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}

// Experience chips map onto the organiser's own package categories.
export const EXPERIENCE_CATEGORY = {
  heritage_walks: ['cultural'], architecture: ['cultural'], food_trails: ['cultural'], spiritual: ['spiritual'],
  markets_crafts: ['cultural'], arts_culture: ['cultural'], nature: ['mountains', 'weekend'], trekking: ['trek', 'mountains', 'adventure'],
  river_water: ['adventure', 'beach'], wildlife: ['wildlife'], beaches: ['beach'],
};

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* Ranks already-filtered trip cards against preferences. Only trips with an open departure
   are considered; ties go to the soonest departure. Returns at most `limit` results. */
export function rankTrips(cards, prefs = {}, { landscapeName = (s) => s, placeName = (s) => s, limit = 5 } = {}) {
  const wantCats = new Set((prefs.experiences || []).flatMap((e) => EXPERIENCE_CATEGORY[e] || []));
  const open = cards.filter((c) => c.nextDeparture && c.nextDeparture.availability !== 'sold_out');
  return open
    .map((c) => {
      const reasons = [];
      let score = 0;
      const lands = (c.landscapes || []).filter((l) => (prefs.landscapes || []).includes(l));
      if (lands.length) { score += 3; reasons.push(`Goes to the ${lands.map(landscapeName).join(' and ')} you picked`); }
      const cats = (c.categories || []).filter((cat) => wantCats.has(cat));
      if (cats.length) { score += 2; reasons.push(`Listed as ${cats.join(', ')} by the organiser`); }
      if (prefs.days && c.durationDays) {
        const diff = Math.abs(c.durationDays - Number(prefs.days));
        score += Math.max(0, 2 - diff);
        if (diff <= 1) reasons.push(`${c.durationDays} days, close to the length you wanted`);
      }
      if (prefs.from) reasons.push(`Departs from ${placeName(prefs.from)}`);
      if (prefs.budget && c.priceFrom != null && c.priceFrom <= Number(prefs.budget)) reasons.push(`From ${inr(c.priceFrom)}, within your budget`);
      reasons.push(`Next open departure ${shortDate(c.nextDeparture.startDate)} with ${c.nextDeparture.seatsAvailable} seats left`);
      return { trip: c, score, reasons: reasons.slice(0, 3) };
    })
    .sort((a, b) => b.score - a.score || Date.parse(a.trip.nextDeparture.startDate) - Date.parse(b.trip.nextDeparture.startDate))
    .slice(0, limit);
}

export function noMatchNote(prefs = {}) {
  const hints = [];
  if (prefs.budget) hints.push('raise the budget');
  if (prefs.month) hints.push('try another month');
  if (prefs.from) hints.push('allow other departure cities');
  return `No listed trip has an open departure that fits all of that${hints.length ? `. Try to ${hints.join(', or ')}.` : '.'}`;
}

/* "Ask this trip": answers only from the listing's own fields. Order matters: the more
   specific topic wins ("not included" before "included"). */
const TOPICS = [
  { keys: ['food', 'meal', 'breakfast', 'lunch', 'dinner', 'eat'], field: 'meals', label: 'Meals' },
  { keys: ['stay', 'hotel', 'room', 'sleep', 'accommodation', 'tent', 'sharing'], field: 'accommodation', label: 'Stay' },
  { keys: ['transport', 'bus', 'travel', 'car', 'train', 'vehicle', 'drive'], field: 'transport', label: 'Transport' },
  { keys: ['pickup', 'pick up', 'meeting', 'where do we meet', 'start point', 'reporting'], field: 'pickupInfo', label: 'Pickup' },
  { keys: ['cancel', 'refund'], field: 'cancellationPolicy', label: 'Cancellation policy' },
  { keys: ['exclude', 'not included', "isn't included", 'extra', 'pay extra'], field: 'exclusions', label: 'Exclusions' },
  { keys: ['include', 'included', 'covers', 'cover'], field: 'inclusions', label: 'Inclusions' },
  { keys: ['price', 'cost', 'seat', 'available', 'date', 'when', 'departure'], field: 'departures', label: 'Departures' },
  { keys: ['day', 'itinerary', 'plan', 'schedule'], field: 'itinerary', label: 'Itinerary' },
];

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && v.length === 0);
const AVAIL_WORDS = { available: 'seats left', sold_out: 'sold out', booking_closed: 'booking closed', closed: 'not taking bookings', cancelled: 'cancelled', departed: 'departed' };

export function answerFromTrip(trip, question) {
  const q = String(question || '').toLowerCase();
  // Keys match at the start of a word, so "seats" never triggers "eat".
  const hit = (k) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(q);
  const topic = TOPICS.find((t) => t.keys.some(hit));
  if (!trip || !topic) {
    return { answered: false, answer: 'I can only answer from this listing: meals, stay, transport, pickup, inclusions, exclusions, cancellation, departures or the itinerary. Try asking about one of those.', sources: [] };
  }
  let v = trip[topic.field];
  if (topic.field === 'pickupInfo' && isEmpty(v)) {
    const withPickup = (trip.departures || []).filter((d) => d.pickupPoint || d.reportingTime);
    if (withPickup.length) v = withPickup.map((d) => `${shortDate(d.startDate)}: ${[d.pickupPoint, d.reportingTime && `report by ${d.reportingTime}`].filter(Boolean).join(', ')}`).join('; ');
  }
  if (isEmpty(v)) return { answered: false, answer: `The organiser hasn't shared ${topic.label.toLowerCase()} details for this trip. Ask them directly before you book.`, sources: [] };
  let answer;
  if (topic.field === 'departures') {
    answer = v.map((d) => `${shortDate(d.startDate)}: ${inr(d.price)} per person, ${d.availability === 'available' ? `${d.seatsAvailable} seats left` : AVAIL_WORDS[d.availability] || d.availability}`).join('; ');
  } else if (topic.field === 'itinerary') {
    answer = v.map((d) => `Day ${d.day}: ${d.title}`).join('; ');
  } else answer = Array.isArray(v) ? v.join('; ') : v;
  return { answered: true, answer, sources: [topic.label] };
}

/* Comparison rows. Each cell carries `missing: true` when the organiser hasn't stated it, so
   the table can say so instead of leaving a blank. No scores, no rankings. */
export const COMPARE_FIELDS = [
  { key: 'price', label: 'Price from', get: (t) => t.priceFrom },
  { key: 'departures', label: 'Upcoming dates', get: (t) => (t.departures || []).filter((d) => !['departed', 'cancelled'].includes(d.availability)) },
  { key: 'duration', label: 'Duration', get: (t) => (t.durationDays ? { days: t.durationDays, nights: t.durationNights } : null) },
  { key: 'from', label: 'Departs from', get: (t) => (t.places?.departureCities?.length ? t.places.departureCities.map((c) => c.name) : t.startLocation ? [t.startLocation] : []) },
  { key: 'accommodation', label: 'Stay', get: (t) => t.accommodation },
  { key: 'transport', label: 'Transport', get: (t) => t.transport },
  { key: 'meals', label: 'Meals', get: (t) => t.meals },
  { key: 'inclusions', label: 'Included', get: (t) => t.inclusions },
  { key: 'exclusions', label: 'Not included', get: (t) => t.exclusions },
  { key: 'cancellation', label: 'Cancellation', get: (t) => t.cancellationPolicy },
  { key: 'organiser', label: 'Organiser', get: (t) => t.operator },
];

export function compareRows(trips) {
  return COMPARE_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    cells: trips.map((t) => {
      const value = f.get(t);
      return { slug: t.slug, value, missing: isEmpty(value) };
    }),
  }));
}

/* Experience search: maps what people type to the organiser-set package categories. */
export const CATEGORY_SEARCH = [
  { value: 'weekend', label: 'Weekend getaways', words: ['weekend', 'short', 'getaway'] },
  { value: 'mountains', label: 'Mountain trips', words: ['mountain', 'hill', 'himalaya', 'snow'] },
  { value: 'trek', label: 'Treks', words: ['trek', 'hike', 'hiking'] },
  { value: 'adventure', label: 'Adventure trips', words: ['adventure', 'rafting', 'camping', 'camp'] },
  { value: 'cultural', label: 'Culture & heritage', words: ['culture', 'heritage', 'history', 'food', 'fort', 'palace'] },
  { value: 'spiritual', label: 'Spiritual journeys', words: ['spiritual', 'temple', 'yoga', 'pilgrim', 'ghat'] },
  { value: 'beach', label: 'Beach trips', words: ['beach', 'sea', 'coast', 'island'] },
  { value: 'wildlife', label: 'Wildlife trips', words: ['wildlife', 'safari', 'tiger', 'birds'] },
  { value: 'international', label: 'International trips', words: ['international', 'abroad', 'foreign'] },
];

export function searchExperiences(query, limit = 3) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 3) return [];
  return CATEGORY_SEARCH.filter((c) => c.label.toLowerCase().includes(q) || c.words.some((w) => w.startsWith(q) || q.startsWith(w))).slice(0, limit);
}
