/* Discovery preferences: vocabulary, validation, a rule-based natural-language parser (works
   without any AI key), and a plain-language summary. Pure functions, no I/O.

   Preference shape (every field optional):
   {
     moods:        ['mountains', 'beaches', ...]        soft (relevance)
     interests:    ['trekking', 'camping', ...]         soft (relevance)
     destination:  { slug, name } | { text }            soft (relevance)
     budget:       'under_5k' | '5k_10k' | '10k_20k' | '20k_plus' | 'flexible'
     maxPrice:     number                                hard (explicit amount beats the band)
     affordable:   boolean                               soft (cheaper first)
     duration:     'weekend' | '3_5' | '6_8' | 'flexible'
     days:         number                                hard (about N days: N-1..N+1)
     departureCity:{ slug, name } | { text }             hard
     dates:        { mode: 'flexible' | 'weekend' | 'range', from, to }   hard
   } */

const MOODS = {
  mountains: { noun: 'mountain', label: 'Mountains', categories: ['mountains', 'trek'], landscapes: ['himalayas'], words: ['mountain', 'himalaya', 'hill', 'valley', 'peak', 'snow'] },
  beaches: { noun: 'beach', label: 'Beaches', categories: ['beach'], landscapes: ['coast'], words: ['beach', 'sea', 'coast', 'island', 'shore'] },
  adventure: { noun: 'adventure', label: 'Adventure', categories: ['adventure', 'trek'], landscapes: [], words: ['adventure', 'rafting', 'trek', 'paraglid', 'camping', 'atv', 'kayak', 'scuba'] },
  nature: { noun: 'nature', label: 'Nature', categories: ['wildlife'], landscapes: ['rivers-valleys', 'northeast', 'himalayas'], words: ['nature', 'waterfall', 'lake', 'forest', 'river', 'falls', 'garden'] },
  culture: { noun: 'culture', label: 'Culture', categories: ['cultural'], landscapes: ['culture-heritage'], words: ['culture', 'local', 'market', 'bazaar', 'folk', 'village'] },
  heritage: { noun: 'heritage', label: 'Heritage', categories: ['cultural'], landscapes: ['culture-heritage', 'desert'], words: ['fort', 'palace', 'heritage', 'monument', 'temple', 'monastery', 'haveli'] },
  luxury: { noun: 'luxury', label: 'Luxury', categories: [], landscapes: [], words: ['luxury', '4-star', '5-star', 'resort', 'boutique', 'premium'] },
  peaceful: { noun: 'peaceful', label: 'Peaceful', categories: ['spiritual'], landscapes: [], words: ['peaceful', 'calm', 'quiet', 'retreat', 'homestay', 'lake', 'slow'] },
  nightlife: { noun: 'nightlife', label: 'Nightlife', categories: [], landscapes: [], words: ['nightlife', 'party', 'club', 'dj', 'bar', 'pub'] },
  food: { noun: 'food', label: 'Food experiences', categories: [], landscapes: [], words: ['food', 'cuisine', 'cooking', 'street food', 'tasting', 'cafe', 'café'] },
};
const MOOD_KEYS = Object.keys(MOODS);

const BUDGETS = {
  under_5k: { label: 'Under ₹5,000', max: 5000 },
  '5k_10k': { label: '₹5,000–₹10,000', max: 10000 },
  '10k_20k': { label: '₹10,000–₹20,000', max: 20000 },
  '20k_plus': { label: '₹20,000+', max: null },
  flexible: { label: 'Flexible', max: null },
};
const DURATIONS = {
  weekend: { label: 'Weekend', min: 1, max: 3 },
  '3_5': { label: '3–5 days', min: 3, max: 5 },
  '6_8': { label: '6–8 days', min: 6, max: 8 },
  flexible: { label: 'Flexible', min: null, max: null },
};

// Activity words people use → the canonical interest we search listing text for.
const INTERESTS = {
  trekking: ['trek', 'trekking', 'hike', 'hiking'],
  camping: ['camp', 'camping', 'tent', 'tents'],
  rafting: ['rafting', 'river rafting'],
  paragliding: ['paragliding'],
  snow: ['snow', 'skiing'],
  bonfire: ['bonfire'],
  boating: ['boating', 'boat', 'houseboat', 'cruise', 'shikara'],
  wildlife: ['wildlife', 'safari'],
  'water sports': ['scuba', 'snorkel', 'snorkelling', 'water sports', 'kayaking'],
  monasteries: ['monastery', 'monasteries'],
  temples: ['temple', 'temples', 'aarti'],
  photography: ['photography', 'photo walk'],
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_RX = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

// Calendar days are Indian dates: departures are local trips, and a UTC slice would move an
// IST-midnight departure to the previous day.
const istDay = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthIndex = (word) => MONTHS.findIndex((m) => m.startsWith(String(word).toLowerCase().slice(0, 3)));
const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const isoRx = /^\d{4}-\d{2}-\d{2}$/;

/* The coming weekend: Friday to Sunday. On Fri/Sat/Sun it is this weekend (from today). */
function upcomingWeekend(now = new Date()) {
  const today = new Date(`${istDay(now)}T00:00:00`);
  const dow = today.getDay(); // 0 Sun … 6 Sat
  const fri = new Date(today);
  if (dow === 0) fri.setDate(today.getDate() - 2);
  else if (dow === 6) fri.setDate(today.getDate() - 1);
  else fri.setDate(today.getDate() + ((5 - dow + 7) % 7));
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  return { from: iso(fri < today ? today : fri), to: iso(sun) };
}

function monthRange(mi, now = new Date()) {
  const y = mi < now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
  return { from: iso(new Date(y, mi, 1)), to: iso(new Date(y, mi + 1, 0)) };
}

/* ------------------------------ validation ------------------------------ */

const cleanText = (v, max = 60) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const cleanPlace = (v) => {
  if (!v || typeof v !== 'object') return null;
  const slug = cleanText(v.slug, 60);
  const name = cleanText(v.name, 60);
  const text = cleanText(v.text, 60);
  if (slug && /^[a-z0-9-]+$/.test(slug)) return { slug, name: name || slug };
  return text ? { text } : null;
};

/* Accepts preferences from the client or from the AI and returns a safe, canonical object.
   Unknown values are dropped rather than guessed. */
function normalisePrefs(raw = {}) {
  const p = {};
  const moods = Array.isArray(raw.moods) ? [...new Set(raw.moods.filter((m) => MOOD_KEYS.includes(m)))] : [];
  if (moods.length) p.moods = moods;
  const interests = Array.isArray(raw.interests)
    ? [...new Set(raw.interests.map((i) => String(i).toLowerCase().trim()).filter((i) => i && i.length <= 30))].slice(0, 6) : [];
  if (interests.length) p.interests = interests;
  const dest = cleanPlace(raw.destination);
  if (dest) p.destination = dest;
  if (BUDGETS[raw.budget]) p.budget = raw.budget;
  const maxPrice = Number(raw.maxPrice);
  if (raw.maxPrice != null && raw.maxPrice !== '' && Number.isFinite(maxPrice) && maxPrice >= 500 && maxPrice <= 1000000) p.maxPrice = Math.round(maxPrice);
  if (raw.affordable === true) p.affordable = true;
  if (DURATIONS[raw.duration]) p.duration = raw.duration;
  const days = Number(raw.days);
  if (raw.days != null && raw.days !== '' && Number.isInteger(days) && days >= 1 && days <= 30) p.days = days;
  const city = cleanPlace(raw.departureCity);
  if (city) p.departureCity = city;
  const d = raw.dates || {};
  if (d.mode === 'weekend') p.dates = { mode: 'weekend' };
  else if (d.mode === 'range' && isoRx.test(d.from || '') && isoRx.test(d.to || '') && d.from <= d.to) p.dates = { mode: 'range', from: d.from, to: d.to };
  return p;
}

/* Hard constraints derived from preferences. */
function constraintsOf(prefs, now = new Date()) {
  const c = {};
  const max = prefs.maxPrice ?? (prefs.budget ? BUDGETS[prefs.budget].max : null);
  if (max) c.maxPrice = max;
  if (prefs.days) { c.minDays = Math.max(1, prefs.days - 1); c.maxDays = prefs.days + 1; }
  else if (prefs.duration && DURATIONS[prefs.duration].min) { c.minDays = DURATIONS[prefs.duration].min; c.maxDays = DURATIONS[prefs.duration].max; }
  if (prefs.departureCity) c.city = prefs.departureCity;
  if (prefs.dates?.mode === 'weekend') c.dateWindow = upcomingWeekend(now);
  else if (prefs.dates?.mode === 'range') c.dateWindow = { from: prefs.dates.from, to: prefs.dates.to };
  return c;
}

/* ------------------------------ text parsing ------------------------------ */

const hasWord = (text, w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text);

function findPlace(fragment, places) {
  const f = fragment.toLowerCase().trim().replace(/[.,!?]+$/, '');
  if (!f) return null;
  return places.find((p) => [p.name, ...(p.aliases || [])].some((n) => n.toLowerCase() === f))
    || places.find((p) => [p.name, ...(p.aliases || [])].some((n) => f.startsWith(n.toLowerCase())));
}

/* Rule-based interpretation of a free-text request. `places` are place summaries
   ({ slug, name, kind, aliases }). Returns { prefs, ambiguities }. Never invents values: an
   unclear word becomes a note the user can act on, not a guessed filter. */
function parseQuery(text, { places = [], now = new Date() } = {}) {
  const t = ` ${String(text || '').toLowerCase().replace(/\s+/g, ' ')} `;
  const raw = { moods: [], interests: [] };
  const ambiguities = [];

  // Budget: an explicit amount ("under ₹8,000", "budget 10k", "within 15000").
  const amount = t.match(/(?:under|below|less than|within|upto|up to|max(?:imum)?|budget(?: of| is)?|around|about)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i)
    || t.match(/(?:₹|rs\.?\s?|inr\s?)([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i);
  if (amount) {
    let n = Number(amount[1].replace(/,/g, ''));
    if (amount[2]) n *= 1000;
    if (n >= 500) {
      raw.maxPrice = n;
      if (/around|about/.test(amount[0])) ambiguities.push({ field: 'budget', message: `Treating “${amount[0].trim()}” as a maximum of ${inr(n)} per person.` });
    }
  }
  if (!raw.maxPrice && /(affordable|cheap|budget[- ]friendly|low[- ]budget|inexpensive|economical|pocket[- ]friendly)/.test(t)) {
    raw.affordable = true;
    ambiguities.push({ field: 'budget', message: '“Affordable” has no amount, so lower-priced trips are shown first. Pick a budget to filter.' });
  }

  // Duration: "3 days", "4-5 days", "2 nights", "a week", "weekend".
  const dur = t.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*(?:days?|d)\b/) || t.match(/(\d{1,2})\s*(days?|d|nights?|n)\b/);
  if (dur && dur[2] && /^\d+$/.test(dur[2])) {
    const a = Number(dur[1]); const b = Number(dur[2]);
    raw.days = Math.round((a + b) / 2);
  } else if (dur) {
    const n = Number(dur[1]);
    raw.days = /^n/.test(dur[2]) ? n + 1 : n;
  } else if (/\b(a|one) week\b|\bweek[- ]long\b/.test(t)) raw.duration = '6_8';
  else if (/weekend/.test(t)) raw.duration = 'weekend';

  // Dates.
  if (/next weekend/.test(t) && [0, 5, 6].includes(now.getDay())) {
    // Already the weekend: "next weekend" means the following one.
    const w = upcomingWeekend(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5));
    raw.dates = { mode: 'range', ...w };
  } else if (/(this|next|upcoming|coming) weekend/.test(t)) raw.dates = { mode: 'weekend' };
  else {
    const between = t.match(new RegExp(`between\\s+(\\d{1,2})\\s+(?:and|-|to)\\s+(\\d{1,2})\\s+${MONTH_RX}`));
    const onDay = t.match(new RegExp(`(?:on|from|starting)?\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RX}\\b`));
    const inMonth = t.match(new RegExp(`(?:in|during|for|this|next)\\s+${MONTH_RX}\\b`));
    if (between) {
      const mi = monthIndex(between[3]);
      const { from } = monthRange(mi, now);
      const y = Number(from.slice(0, 4));
      raw.dates = { mode: 'range', from: iso(new Date(y, mi, Number(between[1]))), to: iso(new Date(y, mi, Number(between[2]))) };
    } else if (onDay) {
      const mi = monthIndex(onDay[2]);
      const y = Number(monthRange(mi, now).from.slice(0, 4));
      const day = iso(new Date(y, mi, Number(onDay[1])));
      raw.dates = { mode: 'range', from: day, to: day };
    } else if (inMonth) raw.dates = { mode: 'range', ...monthRange(monthIndex(inMonth[1]), now) };
    else if (/next month/.test(t)) raw.dates = { mode: 'range', ...monthRange((now.getMonth() + 1) % 12, now) };
  }

  // Departure city: "from Lucknow", "leaving from Pune", "starting in Delhi".
  const from = t.match(/(?:from|leaving|departing|starting|start from|starting from)\s+([a-z][a-z .'-]{1,30}?)(?=\s*(?:,|\.|\?|!|$|\swith|\sfor|\son|\sin|\sto|\sunder|\sbelow|\swithin|\spreferably|\sand|\snext|\sthis|\saround|\sduring|\sbetween|\s\d))/);
  if (from) {
    const frag = from[1].replace(/^(from|in)\s+/, '').trim();
    if (!/^\d/.test(frag) && !/^(here|home|my city)$/.test(frag)) {
      const place = findPlace(frag, places.filter((p) => p.kind === 'city'));
      if (place) raw.departureCity = { slug: place.slug, name: place.name };
      else {
        const name = frag.replace(/\b\w/g, (c) => c.toUpperCase());
        raw.departureCity = { text: name };
        ambiguities.push({ field: 'departureCity', message: `${name} isn't in our city list yet, so trips are matched on the organiser's own start location.` });
      }
    }
  }

  // Destination: "to Spiti", "trip to Goa", "in Rishikesh".
  const dest = t.match(/(?:\sto|\svisit|\svisiting|\strip in|\strek in|\sin)\s+([a-z][a-z .'-]{1,30}?)(?=\s*(?:,|\.|\?|!|$|\swith|\sfor|\son|\sfrom|\sunder|\sbelow|\swithin|\spreferably|\sand|\snext|\sthis|\saround|\sduring|\s\d))/);
  if (dest) {
    const place = findPlace(dest[1], places);
    if (place && place.slug !== raw.departureCity?.slug && monthIndex(dest[1]) === -1) raw.destination = { slug: place.slug, name: place.name };
  }

  for (const [key, m] of Object.entries(MOODS)) if (m.words.some((w) => hasWord(t, w)) || hasWord(t, key)) raw.moods.push(key);
  if (/\bfood\b|foodie|street food|cuisine/.test(t) && !raw.moods.includes('food')) raw.moods.push('food');
  for (const [key, words] of Object.entries(INTERESTS)) if (words.some((w) => hasWord(t, w))) raw.interests.push(key);

  return { prefs: normalisePrefs(raw), ambiguities };
}

/* ------------------------------- summary -------------------------------- */

const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* One plain sentence describing what we understood. */
function summarise(prefs, now = new Date()) {
  const moods = (prefs.moods || []).map((m) => MOODS[m].noun);
  const parts = [];
  parts.push(moods.length ? `${list(moods)} trips` : 'group trips');
  if (prefs.destination) parts.push(`to ${prefs.destination.name || prefs.destination.text}`);
  if (prefs.days) parts.push(`of about ${prefs.days} days`);
  else if (prefs.duration && prefs.duration !== 'flexible') parts.push(prefs.duration === 'weekend' ? 'for a weekend' : `of ${DURATIONS[prefs.duration].label}`);
  if (prefs.departureCity) parts.push(`from ${prefs.departureCity.name || prefs.departureCity.text}`);
  const max = prefs.maxPrice ?? (prefs.budget ? BUDGETS[prefs.budget].max : null);
  if (max) parts.push(`under ${inr(max)} per person`);
  else if (prefs.affordable) parts.push('at a lower price');
  else if (prefs.budget === '20k_plus') parts.push('with a budget above ₹20,000');
  const c = constraintsOf(prefs, now);
  if (prefs.dates?.mode === 'weekend') parts.push(`departing this coming weekend (${fmtDate(c.dateWindow.from)}–${fmtDate(c.dateWindow.to)})`);
  else if (prefs.dates?.mode === 'range') parts.push(prefs.dates.from === prefs.dates.to ? `departing on ${fmtDate(prefs.dates.from)}` : `departing between ${fmtDate(prefs.dates.from)} and ${fmtDate(prefs.dates.to)}`);
  else parts.push('on any dates');
  let s = `Looking for ${parts[0]} ${parts.slice(1).join(', ')}.`;
  if (prefs.interests?.length) s += ` Bonus if they include ${list(prefs.interests)}.`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
  MOODS, MOOD_KEYS, BUDGETS, DURATIONS, INTERESTS,
  normalisePrefs, constraintsOf, parseQuery, summarise, upcomingWeekend, monthRange, iso, istDay,
};
