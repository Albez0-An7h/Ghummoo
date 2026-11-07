/* Discovery matching engine. Never invents trips: every result is a published package from an
   approved organiser, read from the database at request time.

     preferences → hard constraints (budget, departure city, dates, duration, seats)
                 → candidate departures from live inventory
                 → soft relevance (moods, interests, destination, affordability)
                 → ranked results, each with reasons built from the package's own fields
     no exact match → alternatives that miss exactly one constraint, with the difference spelt
                      out, plus an explanation of which constraint ruled trips out. */
const { listCards, presentDeparture, isBookable } = require('../trips');
const { MOODS, INTERESTS, DURATIONS, BUDGETS, constraintsOf, istDay } = require('./prefs');

const CATEGORY_LABEL = {
  weekend: 'a weekend getaway', mountains: 'a mountain trip', adventure: 'an adventure trip', international: 'an international trip',
  cultural: 'a culture and heritage trip', beach: 'a beach trip', wildlife: 'a wildlife trip', spiritual: 'a spiritual trip', trek: 'a trek',
};
const LANDSCAPE_LABEL = { himalayas: 'the Himalayas', 'rivers-valleys': 'rivers and valleys', desert: 'the desert', coast: 'the coast', northeast: 'the Northeast', 'culture-heritage': 'culture and heritage' };

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const day = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
const lc = (s) => String(s || '').toLowerCase();
const has = (text, w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(text);

/* Searchable text per listing field, so explanations can say where a word was found. */
function fieldTexts(pkg) {
  return [
    ['the title', lc(`${pkg.title} ${pkg.summary}`)],
    ['the itinerary', lc((pkg.itinerary || []).map((d) => `${d.title} ${d.description} ${d.stay}`).join(' '))],
    ['the highlights', lc((pkg.highlights || []).join(' '))],
    ['the inclusions', lc((pkg.inclusions || []).join(' '))],
    ['the overview', lc(pkg.overview)],
    ['the stay details', lc(pkg.accommodation)],
  ];
}
const findIn = (texts, words) => {
  for (const [where, text] of texts) if (words.some((w) => has(text, w))) return where;
  return null;
};

/* Soft relevance and its reasons. Every reason names the field it came from. */
function relevance(card, pkg, prefs) {
  let score = 0;
  const reasons = [];
  const unmet = [];
  const texts = fieldTexts(pkg);
  for (const m of prefs.moods || []) {
    const mood = MOODS[m];
    const cat = (card.categories || []).find((c) => mood.categories.includes(c));
    const land = (card.landscapes || []).find((l) => mood.landscapes.includes(l));
    const where = findIn(texts, mood.words);
    if (cat) { score += 3; reasons.push(`Listed as ${CATEGORY_LABEL[cat] || cat} by the organiser`); }
    else if (land) { score += 2; reasons.push(`Goes to ${card.places.destinations.map((p) => p.name).join(' & ') || card.destination} in ${LANDSCAPE_LABEL[land] || land}`); }
    else if (where) { score += 1; reasons.push(`${where.charAt(0).toUpperCase()}${where.slice(1)} mentions ${mood.noun} experiences`); }
    else unmet.push(`${/^[aeiou]/.test(mood.noun) ? 'an' : 'a'} ${mood.noun} trip`);
  }
  for (const i of prefs.interests || []) {
    const words = INTERESTS[i] || [i];
    const where = findIn(texts, words);
    if (where) { score += 2; reasons.push(`${where.charAt(0).toUpperCase()}${where.slice(1)} mentions ${i}`); }
  }
  if (prefs.destination) {
    const d = prefs.destination;
    const hit = d.slug ? card.places.destinations.some((p) => p.slug === d.slug) : lc(card.destination).includes(lc(d.text));
    if (hit) { score += 5; reasons.unshift(`Goes to ${d.name || d.text}`); } else unmet.push(`a trip to ${d.name || d.text}`);
  }
  return { score, reasons, unmet };
}

function cityMatches(card, pkg, city) {
  if (!city) return true;
  if (city.slug && card.places.departureCities.some((p) => p.slug === city.slug)) return true;
  const name = lc(city.name || city.text);
  return Boolean(name) && lc(pkg.startLocation).split(/[,&/]| and /).some((s) => s.trim() === name);
}

const durationOk = (pkg, c) => !c.minDays || (pkg.durationDays != null && pkg.durationDays >= c.minDays && pkg.durationDays <= c.maxDays);
const inWindow = (d, w) => !w || (istDay(d.startDate) >= w.from && istDay(d.startDate) <= w.to);
const priceOk = (d, c) => !c.maxPrice || d.price <= c.maxPrice;

/* Evaluates one listing against every hard constraint. */
function evaluate(row, c, now) {
  const { card, pkg, deps } = row;
  const open = deps.filter((d) => isBookable(d) && new Date(d.startDate) >= now);
  const pick = (fn) => open.filter(fn).sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;
  const city = cityMatches(card, pkg, c.city);
  const duration = durationOk(pkg, c);
  return {
    city,
    duration,
    exactDep: pick((d) => inWindow(d, c.dateWindow) && priceOk(d, c)),
    anyDateDep: pick((d) => priceOk(d, c)), // relax dates
    anyPriceDep: pick((d) => inWindow(d, c.dateWindow)), // relax budget
    anyDep: pick(() => true),
    // Matches the dates and budget but every such departure is full or closed.
    soldOutOnDates: !open.some((d) => inWindow(d, c.dateWindow) && priceOk(d, c))
      && deps.some((d) => inWindow(d, c.dateWindow) && priceOk(d, c) && new Date(d.startDate) >= now),
  };
}

function presentResult(row, dep, prefs, c, rel, extra = {}) {
  const { card, pkg } = row;
  const reasons = [...rel.reasons];
  const caveats = [];
  const max = c.maxPrice;
  if (max) reasons.push(`Within your budget: ${inr(dep.price)} per person`);
  else reasons.push(`${inr(dep.price)} per person on ${day(dep.startDate)}`);
  if (c.minDays && pkg.durationDays) reasons.push(`${pkg.durationDays} days, fits ${prefs.days ? `about ${prefs.days} days` : DURATIONS[prefs.duration].label.toLowerCase()}`);
  if (c.city) reasons.push(`Departs from ${c.city.name || c.city.text}, as you asked`);
  if (c.dateWindow) reasons.push(`Departs ${day(dep.startDate)}, within your dates`);
  reasons.push(`${dep.seatsAvailable} seat${dep.seatsAvailable === 1 ? '' : 's'} left on ${day(dep.startDate)}`);
  if (rel.unmet.length) caveats.push(`Isn't listed as ${rel.unmet.join(' or ')}`);
  if (!c.city && card.places.departureCities.length) caveats.push(`Departs from ${card.places.departureCities.map((p) => p.name).join(', ')}`);
  else if (!c.city && pkg.startLocation) caveats.push(`Departs from ${pkg.startLocation}`);
  const departure = presentDeparture(dep);
  return {
    trip: { ...card, nextDeparture: departure, priceFrom: dep.price },
    departure,
    reasons: [...new Set(reasons)].slice(0, 5),
    caveats: [...caveats, ...(extra.caveats || [])],
    ...(extra.difference ? { difference: extra.difference, relaxed: extra.relaxed } : {}),
  };
}

const rank = (prefs) => (a, b) => (b.rel.score - a.rel.score)
  || (prefs.affordable ? a.dep.price - b.dep.price : 0)
  || (new Date(a.dep.startDate) - new Date(b.dep.startDate))
  || (a.dep.price - b.dep.price);

/* Main entry: returns { results, alternatives, explanation, counts }. */
async function searchTrips(prefs, { now = new Date(), limit = 6 } = {}) {
  const c = constraintsOf(prefs, now);
  const rows = await listCards({});
  const evals = rows.map((row) => ({ row, e: evaluate(row, c, now), rel: relevance(row.card, row.pkg, prefs) }));

  const exact = evals.filter(({ e }) => e.city && e.duration && e.exactDep)
    .map((x) => ({ ...x, dep: x.e.exactDep }))
    .sort(rank(prefs));
  const results = exact.slice(0, limit).map((x) => presentResult(x.row, x.dep, prefs, c, x.rel));

  const counts = {
    published: rows.length,
    exact: exact.length,
    blockedBy: {
      city: evals.filter(({ e }) => !e.city && e.duration && e.exactDep).length,
      duration: evals.filter(({ e }) => e.city && !e.duration && e.exactDep).length,
      dates: c.dateWindow ? evals.filter(({ e }) => e.city && e.duration && !e.exactDep && e.anyDateDep).length : 0,
      budget: c.maxPrice ? evals.filter(({ e }) => e.city && e.duration && !e.exactDep && e.anyPriceDep).length : 0,
      seats: evals.filter(({ e }) => e.city && e.duration && !e.exactDep && e.soldOutOnDates).length,
    },
  };

  let alternatives = [];
  let explanation = null;
  if (!exact.length) {
    const cityName = c.city ? (c.city.name || c.city.text) : '';
    const alts = [];
    for (const x of evals) {
      const { e, row } = x;
      const { pkg, card } = row;
      if (!e.city && e.duration && e.exactDep) {
        const from = card.places.departureCities.map((p) => p.name).join(', ') || pkg.startLocation || 'another city';
        alts.push({ ...x, dep: e.exactDep, relaxed: 'city', difference: `Departs from ${from}, not ${cityName}, so you would need to arrange travel to ${from}.` });
      } else if (e.city && !e.duration && e.exactDep) {
        alts.push({ ...x, dep: e.exactDep, relaxed: 'duration', difference: pkg.durationDays ? `${pkg.durationDays} days, ${pkg.durationDays > c.maxDays ? 'longer' : 'shorter'} than you asked for.` : 'The organiser hasn\'t stated the duration.' });
      } else if (e.city && e.duration && !e.exactDep && c.dateWindow && e.anyDateDep) {
        alts.push({ ...x, dep: e.anyDateDep, relaxed: 'dates', difference: `Next date with seats in your budget is ${day(e.anyDateDep.startDate)}, outside your dates.` });
      } else if (e.city && e.duration && !e.exactDep && c.maxPrice && e.anyPriceDep) {
        alts.push({ ...x, dep: e.anyPriceDep, relaxed: 'budget', difference: `${inr(e.anyPriceDep.price)} per person, ${inr(e.anyPriceDep.price - c.maxPrice)} over your budget.` });
      }
    }
    alternatives = alts.sort(rank(prefs)).slice(0, 4).map((x) => presentResult(x.row, x.dep, prefs, { ...c, ...(x.relaxed === 'city' ? { city: null } : {}), ...(x.relaxed === 'dates' ? { dateWindow: null } : {}), ...(x.relaxed === 'budget' ? { maxPrice: null } : {}), ...(x.relaxed === 'duration' ? { minDays: null } : {}) }, x.rel, { difference: x.difference, relaxed: x.relaxed }));

    const b = counts.blockedBy;
    const parts = [];
    if (c.city && b.city) parts.push(`no listed trip departs from ${cityName}, but ${b.city} match${b.city === 1 ? 'es' : ''} everything else`);
    else if (c.city && !evals.some(({ e }) => e.city)) parts.push(`no listed trip departs from ${cityName}`);
    if (b.budget) parts.push(`${b.budget} trip${b.budget === 1 ? ' is' : 's are'} over ${inr(c.maxPrice)}`);
    else if (c.maxPrice && !evals.some(({ e }) => e.anyDep && priceOk(e.anyDep, c))) parts.push(`no open departure is under ${inr(c.maxPrice)}`);
    if (b.dates) parts.push(`${b.dates} trip${b.dates === 1 ? ' has' : 's have'} seats only on other dates`);
    if (b.duration) parts.push(`${b.duration} trip${b.duration === 1 ? ' is' : 's are'} a different length`);
    if (b.seats) parts.push(`${b.seats} trip${b.seats === 1 ? ' is' : 's are'} sold out or closed for booking on your dates`);
    if (!rows.length) explanation = 'No trips are published right now.';
    else if (parts.length) explanation = `No trip matches all of your choices: ${parts.join('; ')}.`;
    else explanation = 'No trip matches all of these choices together. Try loosening the dates, budget or departure city.';
  }

  return { results, alternatives, explanation, counts, constraints: c };
}

module.exports = { searchTrips, BUDGETS };
