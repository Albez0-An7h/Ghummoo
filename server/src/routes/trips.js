const router = require('express').Router();
const { TripPackage, TripDeparture, Operator } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { notFoundErr } = require('../utils/http');
const { escapeRegex } = require('../utils/text');
const { listCards, presentCard, presentDeparture, publicOperator, ratingSummary, isBookable } = require('../services/trips');

// GET /api/trips?q=&destination=&category=&minPrice=&maxPrice=&from=&to=&minDays=&maxDays=&city=&sort=&limit=
router.get('/', asyncHandler(async (req, res) => {
  const { q, destination, category, city, sort } = req.query;
  const pkgQuery = {};
  const and = [];
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    and.push({ $or: [{ title: rx }, { destination: rx }, { region: rx }, { country: rx }, { summary: rx }, { highlights: rx }] });
  }
  if (destination) {
    const rx = new RegExp(escapeRegex(destination), 'i');
    and.push({ $or: [{ destination: rx }, { region: rx }, { country: rx }] });
  }
  if (category) pkgQuery.categories = { $in: String(category).split(',') };
  if (city) pkgQuery.startLocation = new RegExp(escapeRegex(city), 'i');
  if (req.query.minDays) pkgQuery.durationDays = { ...(pkgQuery.durationDays || {}), $gte: Number(req.query.minDays) };
  if (req.query.maxDays) pkgQuery.durationDays = { ...(pkgQuery.durationDays || {}), $lte: Number(req.query.maxDays) };
  if (and.length) pkgQuery.$and = and;

  let rows = await listCards(pkgQuery);

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(`${req.query.to}T23:59:59`) : null;
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

  if (from || to) {
    rows = rows.map(({ card, deps }) => {
      const inRange = deps.filter((d) => isBookable(d) && (!from || new Date(d.startDate) >= from) && (!to || new Date(d.startDate) <= to));
      if (!inRange.length) return null;
      const next = inRange[0];
      return { card: { ...card, nextDeparture: presentDeparture(next), seatsLeftNext: next.seatsAvailable, priceFrom: Math.min(...inRange.map((d) => d.price)) }, deps: inRange };
    }).filter(Boolean);
  }
  let cards = rows.map((r) => r.card);
  if (minPrice != null) cards = cards.filter((c) => c.priceFrom != null && c.priceFrom >= minPrice);
  if (maxPrice != null) cards = cards.filter((c) => c.priceFrom != null && c.priceFrom <= maxPrice);
  if (req.query.available === 'true') cards = cards.filter((c) => c.nextDeparture);

  const far = new Date('2999-01-01').getTime();
  const sorters = {
    price_asc: (a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity),
    price_desc: (a, b) => (b.priceFrom ?? -1) - (a.priceFrom ?? -1),
    departure: (a, b) => (a.nextDeparture ? new Date(a.nextDeparture.startDate).getTime() : far) - (b.nextDeparture ? new Date(b.nextDeparture.startDate).getTime() : far),
    duration: (a, b) => (a.durationDays || 0) - (b.durationDays || 0),
  };
  // Default: trips with an upcoming departure first, soonest first.
  cards.sort(sorters[sort] || sorters.departure);

  const limit = Math.min(Number(req.query.limit) || 60, 100);
  res.json({ success: true, data: { items: cards.slice(0, limit), total: cards.length } });
}));

// GET /api/trips/meta — facets for filters and the destinations page.
router.get('/meta', asyncHandler(async (req, res) => {
  const rows = await listCards({});
  const destinations = new Map();
  const cities = new Set();
  const categories = new Map();
  for (const { card } of rows) {
    const key = card.destination;
    if (key) {
      const cur = destinations.get(key) || { name: key, region: card.region, country: card.country, tripCount: 0, image: card.coverImage, priceFrom: null };
      cur.tripCount += 1;
      if (card.priceFrom != null) cur.priceFrom = cur.priceFrom == null ? card.priceFrom : Math.min(cur.priceFrom, card.priceFrom);
      destinations.set(key, cur);
    }
    if (card.startLocation) cities.add(card.startLocation);
    for (const c of card.categories || []) categories.set(c, (categories.get(c) || 0) + 1);
  }
  const prices = rows.map((r) => r.card.priceFrom).filter((p) => p != null);
  res.json({
    success: true,
    data: {
      destinations: [...destinations.values()].sort((a, b) => b.tripCount - a.tripCount),
      cities: [...cities].sort(),
      categories: [...categories.entries()].map(([name, count]) => ({ name, count })),
      priceRange: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
      totalTrips: rows.length,
    },
  });
}));

// GET /api/trips/:slug — full detail. Owners and admins can preview unpublished packages.
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const pkg = await TripPackage.findOne({ slug: req.params.slug }).lean();
  if (!pkg) throw notFoundErr('Trip not found');
  const operator = await Operator.findById(pkg.operator).lean();
  const isOwner = req.user && operator && String(operator.owner) === String(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  const isPublic = pkg.status === 'published' && operator && operator.status === 'approved';
  if (!isPublic && !isOwner && !isAdmin) throw notFoundErr('Trip not found');

  const deps = await TripDeparture.find({ package: pkg._id, status: { $ne: 'cancelled' }, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).lean();
  const reviews = await ratingSummary(pkg._id);

  let similar = [];
  if (isPublic) {
    const rows = await listCards({ _id: { $ne: pkg._id }, $or: [{ categories: { $in: pkg.categories || [] } }, { region: pkg.region || '__none__' }] }, { limit: 12 });
    similar = rows.map((r) => r.card).slice(0, 4);
  }

  const card = presentCard(pkg, deps, operator);
  res.json({
    success: true,
    data: {
      ...pkg,
      ...card,
      preview: !isPublic,
      departures: deps.map(presentDeparture),
      operator: {
        ...publicOperator(operator),
        description: operator.description,
        contactEmail: operator.contactEmail,
        contactPhone: operator.contactPhone,
        instagram: operator.instagram,
        website: operator.website,
        foundedYear: operator.foundedYear,
        memberSince: operator.createdAt,
      },
      reviews,
      similar,
    },
  });
}));

module.exports = router;
