/* Prototype data access. Mirrors the shapes of the real endpoints (docs/V0_1_ROUTE_MAP.md) so
   screens can be connected later by swapping this module for API calls:

     getLandscapes()      ~ GET /api/india/landscapes
     getLandscape(slug)   ~ GET /api/india/landscapes/:slug
     getCities()          ~ GET /api/india/cities
     getPlace(slug)       ~ GET /api/india/places/:slug
     listTrips(filters)   ~ GET /api/trips?…
     getTrip(slug)        ~ GET /api/trips/:slug
     matchTrips(prefs)    ~ POST /api/ai/match        (deterministic prototype ranking)
     askTrip(slug, q)     ~ POST /api/ai/trips/:slug/ask (keyword answers from the listing only)

   A short artificial delay keeps loading states honest. Add ?simulate=error or ?simulate=slow
   to any prototype URL to see error and long-loading states. */
import india from './india.generated.json';
import { PACKAGES } from './packages';
import { rankTrips, noMatchNote, answerFromTrip, searchPlaces as searchPlaceList } from '../../lib/discovery';

const placesBySlug = new Map(india.places.map((p) => [p.slug, p]));
const landscapesBySlug = new Map(india.landscapes.map((l) => [l.slug, l]));

function simulate() {
  const mode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('simulate') : null;
  const ms = mode === 'slow' ? 2500 : 220;
  return new Promise((resolve, reject) => {
    setTimeout(() => (mode === 'error' ? reject(new Error('Sample data could not be loaded (simulated error).')) : resolve()), ms);
  });
}

/* ------------------------------ derivations ------------------------------ */

// Same rules as server/src/services/trips.js#availabilityOf.
export function availabilityOf(d, now = new Date()) {
  if (d.status === 'cancelled') return 'cancelled';
  if (new Date(d.startDate) < now) return 'departed';
  if (d.status === 'closed') return 'closed';
  if (new Date(d.bookingDeadline || d.startDate) < now) return 'booking_closed';
  if (d.seatsAvailable <= 0) return 'sold_out';
  return 'available';
}

const placeSummary = (p) => p && ({
  slug: p.slug, name: p.name, kind: p.kind, placeType: p.placeType, state: p.state, featured: p.featured, aliases: p.aliases || [],
  intro: p.intro, theme: p.theme, experiences: p.experiences || [], landscapes: p.landscapes || [],
  landmarks: (p.landmarks || []).map((m) => ({ slug: m.slug, name: m.name, kind: m.kind })),
});

const landscapesOfTrip = (pkg) => [...new Set(pkg.destinationRefs.flatMap((s) => placesBySlug.get(s)?.landscapes || []))];

function presentCard(pkg) {
  const deps = pkg.departures.map((d) => ({ ...d, availability: availabilityOf(d) }));
  const upcoming = deps.filter((d) => !['departed', 'cancelled'].includes(d.availability));
  const bookable = upcoming.filter((d) => d.availability === 'available');
  const next = bookable[0] || null;
  return {
    _id: pkg.slug,
    slug: pkg.slug,
    title: pkg.title,
    summary: pkg.summary,
    destination: pkg.destination,
    places: {
      destinations: pkg.destinationRefs.map((s) => placeSummary(placesBySlug.get(s))).filter(Boolean),
      departureCities: pkg.departureCityRefs.map((s) => placeSummary(placesBySlug.get(s))).filter(Boolean),
    },
    landscapes: landscapesOfTrip(pkg),
    categories: pkg.categories,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    currency: pkg.currency,
    coverImage: pkg.coverImage,
    coverAlt: pkg.coverAlt || '',
    priceFrom: bookable.length ? Math.min(...bookable.map((d) => d.price)) : null,
    nextDeparture: next,
    upcomingCount: upcoming.length,
    bookableCount: bookable.length,
    operator: pkg.operator,
    isSample: true,
  };
}

const cards = () => PACKAGES.map(presentCard);
const tripsTo = (slugs) => cards().filter((c) => c.places.destinations.some((p) => slugs.includes(p.slug)));
const tripsFrom = (slugs) => cards().filter((c) => c.places.departureCities.some((p) => slugs.includes(p.slug)));

/* ------------------------------ India content ------------------------------ */

export const FEATURED_CITY_SCENES = ['jaipur', 'varanasi', 'delhi', 'mumbai'];

export function landscapesSync() {
  return [...india.landscapes].sort((a, b) => a.order - b.order).map((l) => {
    const placeSlugs = india.places.filter((p) => p.landscapes.includes(l.slug)).map((p) => p.slug);
    return { ...l, placeCount: placeSlugs.length, tripCount: tripsTo(placeSlugs).length };
  });
}

export function citiesSync() {
  return india.places.filter((p) => p.featured).sort((a, b) => a.order - b.order).map((c) => ({
    ...placeSummary(c),
    tripCounts: { to: tripsTo([c.slug]).length, from: tripsFrom([c.slug]).length },
  }));
}

export function placeSync(slug) {
  const p = placesBySlug.get(slug);
  if (!p) return null;
  const nearby = (p.nearby || []).map((s) => placesBySlug.get(s)).filter(Boolean);
  const to = tripsTo([p.slug]);
  const seen = new Set(to.map((t) => t.slug));
  return {
    ...placeSummary(p),
    landmarks: p.landmarks || [],
    highlights: p.highlights || [],
    assets: p.assets || [],
    landscapes: (p.landscapes || []).map((s) => landscapesBySlug.get(s)).filter(Boolean).map((l) => ({ slug: l.slug, name: l.name, palette: l.palette })),
    nearby: nearby.map(placeSummary),
    relatedPackages: {
      to,
      from: p.kind === 'city' ? tripsFrom([p.slug]) : [],
      nearby: tripsTo(nearby.map((n) => n.slug)).filter((t) => !seen.has(t.slug)),
    },
  };
}

export function landscapeSync(slug) {
  const l = landscapesBySlug.get(slug);
  if (!l) return null;
  const places = india.places.filter((p) => p.landscapes.includes(slug))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  return { ...l, places: places.map(placeSummary), trips: tripsTo(places.map((p) => p.slug)) };
}

export const searchPlaces = (query, limit = 8) => searchPlaceList(allPlaces(), query, limit);

export const getLandscapes = async () => { await simulate(); return landscapesSync(); };
export const getCities = async () => { await simulate(); return citiesSync(); };
export async function getPlace(slug) {
  await simulate();
  const p = placeSync(slug);
  if (!p) throw Object.assign(new Error('We could not find that place.'), { status: 404 });
  return p;
}
export async function getLandscape(slug) {
  await simulate();
  const l = landscapeSync(slug);
  if (!l) throw Object.assign(new Error('We could not find that landscape.'), { status: 404 });
  return l;
}
export const allPlaces = () => india.places.map(placeSummary);
export const placeName = (slug) => placesBySlug.get(slug)?.name || slug;
export const landscapeName = (slug) => landscapesBySlug.get(slug)?.name || slug;

/* --------------------------------- trips ---------------------------------- */

export const SORTS = [
  { value: 'departure', label: 'Soonest departure' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'duration', label: 'Shortest first' },
];

export function filterTrips(f = {}) {
  let list = cards();
  const q = (f.q || '').trim().toLowerCase();
  if (q) {
    list = list.filter((c) => [c.title, c.destination, c.summary, ...c.places.destinations.map((p) => p.name), ...c.places.departureCities.map((p) => p.name)]
      .some((s) => s && s.toLowerCase().includes(q)));
  }
  if (f.place) list = list.filter((c) => c.places.destinations.some((p) => p.slug === f.place) || c.places.departureCities.some((p) => p.slug === f.place));
  if (f.from) list = list.filter((c) => c.places.departureCities.some((p) => p.slug === f.from));
  if (f.landscape) list = list.filter((c) => c.landscapes.includes(f.landscape));
  if (f.maxPrice) list = list.filter((c) => c.priceFrom != null && c.priceFrom <= Number(f.maxPrice));
  if (f.maxDays) list = list.filter((c) => c.durationDays && c.durationDays <= Number(f.maxDays));
  if (f.month) {
    list = list.filter((c) => PACKAGES.find((p) => p.slug === c.slug).departures
      .some((d) => availabilityOf(d) === 'available' && d.startDate.slice(0, 7) === f.month));
  }
  if (f.available) list = list.filter((c) => c.nextDeparture);
  const far = Number.MAX_SAFE_INTEGER;
  const sorters = {
    price_asc: (a, b) => (a.priceFrom ?? far) - (b.priceFrom ?? far),
    price_desc: (a, b) => (b.priceFrom ?? -1) - (a.priceFrom ?? -1),
    duration: (a, b) => (a.durationDays || far) - (b.durationDays || far),
    departure: (a, b) => (a.nextDeparture ? Date.parse(a.nextDeparture.startDate) : far) - (b.nextDeparture ? Date.parse(b.nextDeparture.startDate) : far),
  };
  return list.sort(sorters[f.sort] || sorters.departure);
}

export async function listTrips(filters) {
  await simulate();
  const items = filterTrips(filters);
  return { items, total: items.length };
}

export function tripSync(slug) {
  const pkg = PACKAGES.find((p) => p.slug === slug);
  if (!pkg) return null;
  const card = presentCard(pkg);
  return {
    ...card,
    accommodation: pkg.accommodation, transport: pkg.transport, meals: pkg.meals,
    inclusions: pkg.inclusions, exclusions: pkg.exclusions, pickupInfo: pkg.pickupInfo,
    cancellationPolicy: pkg.cancellationPolicy, itinerary: pkg.itinerary,
    departures: pkg.departures.map((d) => ({ ...d, availability: availabilityOf(d) })).filter((d) => d.availability !== 'departed'),
  };
}

export async function getTrip(slug) {
  await simulate();
  const t = tripSync(slug);
  if (!t) throw Object.assign(new Error('We could not find that trip.'), { status: 404 });
  return t;
}

export const sampleMonths = () => {
  const set = new Set(PACKAGES.flatMap((p) => p.departures.filter((d) => availabilityOf(d) === 'available').map((d) => d.startDate.slice(0, 7))));
  return [...set].sort();
};

export const departureCityOptions = () => {
  const slugs = new Set(PACKAGES.flatMap((p) => p.departureCityRefs));
  return [...slugs].map((s) => placeSummary(placesBySlug.get(s))).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
};

/* ---------------------------- help me decide ------------------------------ */

/* Stand-in for the live ranking: same pure helper (lib/discovery.js) over sample cards. */
export async function matchTrips(prefs) {
  await simulate();
  const base = filterTrips({ maxPrice: prefs.budget, month: prefs.month, from: prefs.from, available: true });
  const results = rankTrips(base, prefs, { landscapeName, placeName });
  return { mode: 'prototype', results, note: results.length ? '' : noMatchNote(prefs) };
}

/* Answers only from this listing's own fields (lib/discovery.js). */
export async function askTrip(slug, question) {
  await simulate();
  return answerFromTrip(tripSync(slug), question);
}
