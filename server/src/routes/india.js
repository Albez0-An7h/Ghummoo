// Public, read-only India content directory: landscapes, cities, destinations, and the real
// published packages linked to them. Related packages are derived at request time from
// TripPackage.destinationRefs / departureCityRefs, so they can never point at a stale listing.
const router = require('express').Router();
const { Landscape, Place } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notFoundErr } = require('../utils/http');
const { listCards } = require('../services/trips');

const PUBLISHED = { contentStatus: 'published' };
const PLACE_SUMMARY = 'slug name kind placeType state country featured intro theme landmarks.slug landmarks.name experiences assets';

router.use((req, res, next) => { res.set('Cache-Control', 'public, max-age=300'); next(); });

const landscapeOut = (l) => ({ slug: l.slug, name: l.name, order: l.order, tagline: l.tagline, intro: l.intro, palette: l.palette, assets: l.assets });
const placeOut = (p) => ({
  slug: p.slug, name: p.name, kind: p.kind, placeType: p.placeType, state: p.state, country: p.country,
  featured: p.featured, intro: p.intro, theme: p.theme, experiences: p.experiences, assets: p.assets,
  landmarks: (p.landmarks || []).map((m) => ({ slug: m.slug, name: m.name })),
});

const hasAny = (ids, set) => (ids || []).some((id) => set.has(String(id)));

// Published, bookable-or-not cards for packages linked to any of `placeIds`.
async function tripsFor(placeIds, field = 'destinationRefs') {
  if (!placeIds.length) return [];
  const rows = await listCards({ [field]: { $in: placeIds } });
  return rows.map((r) => r.card);
}

// GET /api/india/places: every published place (summary), for search suggestions.
router.get('/places', asyncHandler(async (req, res) => {
  const places = await Place.find(PUBLISHED, 'slug name kind placeType state featured aliases theme landscapes').sort({ featured: -1, order: 1, name: 1 }).populate('landscapes', 'slug').lean();
  res.json({ success: true, data: places.map((p) => ({ slug: p.slug, name: p.name, kind: p.kind, placeType: p.placeType, state: p.state, featured: p.featured, aliases: p.aliases || [], theme: p.theme, landscapes: (p.landscapes || []).filter(Boolean).map((l) => l.slug) })) });
}));

// GET /api/india/landscapes: the six themes with honest counts.
router.get('/landscapes', asyncHandler(async (req, res) => {
  const [landscapes, places, rows] = await Promise.all([
    Landscape.find(PUBLISHED).sort({ order: 1 }).lean(),
    Place.find(PUBLISHED, '_id landscapes').lean(),
    listCards({ 'destinationRefs.0': { $exists: true } }),
  ]);
  const data = landscapes.map((l) => {
    const ids = new Set(places.filter((p) => hasAny(p.landscapes, new Set([String(l._id)]))).map((p) => String(p._id)));
    return { ...landscapeOut(l), placeCount: ids.size, tripCount: rows.filter((r) => hasAny(r.pkg.destinationRefs, ids)).length };
  });
  res.json({ success: true, data });
}));

// GET /api/india/landscapes/:slug: one theme, its places and real trips there.
router.get('/landscapes/:slug', asyncHandler(async (req, res) => {
  const l = await Landscape.findOne({ slug: req.params.slug, ...PUBLISHED }).lean();
  if (!l) throw notFoundErr('Landscape not found');
  const places = await Place.find({ landscapes: l._id, ...PUBLISHED }, PLACE_SUMMARY).sort({ featured: -1, order: 1, name: 1 }).lean();
  const trips = await tripsFor(places.map((p) => p._id));
  res.json({ success: true, data: { ...landscapeOut(l), places: places.map(placeOut), trips } });
}));

// GET /api/india/cities: the curated city directory.
router.get('/cities', asyncHandler(async (req, res) => {
  const cities = await Place.find({ kind: 'city', featured: true, ...PUBLISHED }, PLACE_SUMMARY).sort({ order: 1 }).lean();
  const [toRows, fromRows] = await Promise.all([
    listCards({ destinationRefs: { $in: cities.map((c) => c._id) } }),
    listCards({ departureCityRefs: { $in: cities.map((c) => c._id) } }),
  ]);
  const count = (rows, field, id) => rows.filter((r) => hasAny(r.pkg[field], new Set([String(id)]))).length;
  res.json({
    success: true,
    data: cities.map((c) => ({ ...placeOut(c), tripCounts: { to: count(toRows, 'destinationRefs', c._id), from: count(fromRows, 'departureCityRefs', c._id) } })),
  });
}));

// GET /api/india/places/:slug: a city or destination with landmarks, nearby places and related trips.
router.get('/places/:slug', asyncHandler(async (req, res) => {
  const p = await Place.findOne({ slug: req.params.slug, ...PUBLISHED })
    .populate({ path: 'landscapes', match: PUBLISHED, select: 'slug name palette' })
    .populate({ path: 'nearby', match: PUBLISHED, select: PLACE_SUMMARY })
    .lean();
  if (!p) throw notFoundErr('Place not found');
  const nearby = (p.nearby || []).filter(Boolean);
  const [to, from, nearbyTrips] = await Promise.all([
    tripsFor([p._id], 'destinationRefs'),
    p.kind === 'city' ? tripsFor([p._id], 'departureCityRefs') : [],
    tripsFor(nearby.map((n) => n._id), 'destinationRefs'),
  ]);
  const seen = new Set(to.map((t) => String(t._id)));
  res.json({
    success: true,
    data: {
      ...placeOut(p),
      aliases: p.aliases,
      landmarks: p.landmarks,
      highlights: p.highlights,
      landscapes: (p.landscapes || []).filter(Boolean).map((l) => ({ slug: l.slug, name: l.name, palette: l.palette })),
      nearby: nearby.map(placeOut),
      relatedPackages: {
        to, // trips that go to this place
        from, // trips that depart from this city
        nearby: nearbyTrips.filter((t) => !seen.has(String(t._id))), // trips to nearby places
      },
    },
  });
}));

module.exports = router;
