const { Operator, TripPackage, TripDeparture, Review, Place, Landscape } = require('../models');

// The public "Verified" badge needs both an admin-reviewed verification and listing approval.
const isVerified = (op) => Boolean(op && op.verifiedAt && op.status === 'approved');

const publicOperator = (op) => op && ({
  _id: op._id,
  businessName: op.businessName,
  slug: op.slug,
  location: op.location,
  logoUrl: op.logoUrl,
  verified: isVerified(op),
  isDemo: op.isDemo,
});

const upcomingFilter = () => ({ status: { $ne: 'cancelled' }, startDate: { $gte: new Date() } });

const isBookable = (d) => {
  const now = new Date();
  const deadline = d.bookingDeadline || d.startDate;
  return d.status === 'open' && d.seatsAvailable > 0 && new Date(deadline) >= now && new Date(d.startDate) >= now;
};

// Public availability state of a departure, derived from stored fields only.
function availabilityOf(d, now = new Date()) {
  if (d.status === 'cancelled') return 'cancelled';
  if (new Date(d.startDate) < now) return 'departed';
  if (d.status === 'closed') return 'closed';
  if (new Date(d.bookingDeadline || d.startDate) < now) return 'booking_closed';
  if (d.seatsAvailable <= 0) return 'sold_out';
  return 'available';
}

const presentDeparture = (d) => ({
  _id: d._id,
  startDate: d.startDate,
  endDate: d.endDate,
  price: d.price,
  totalCapacity: d.totalCapacity,
  seatsAvailable: d.seatsAvailable,
  bookingDeadline: d.bookingDeadline,
  pickupPoint: d.pickupPoint,
  reportingTime: d.reportingTime,
  status: d.status,
  isBookable: isBookable(d),
  availability: availabilityOf(d),
});

// Card shape used in listings.
function presentCard(pkg, departures, operator) {
  const bookable = departures.filter(isBookable);
  const next = bookable[0] || null;
  const prices = bookable.map((d) => d.price);
  return {
    _id: pkg._id,
    slug: pkg.slug,
    title: pkg.title,
    destination: pkg.destination,
    region: pkg.region,
    country: pkg.country,
    startLocation: pkg.startLocation,
    categories: pkg.categories,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    coverImage: pkg.coverImage,
    summary: pkg.summary,
    currency: pkg.currency,
    priceFrom: prices.length ? Math.min(...prices) : pkg.basePrice,
    nextDeparture: next ? presentDeparture(next) : null,
    departureCount: bookable.length,
    seatsLeftNext: next ? next.seatsAvailable : null,
    operator: publicOperator(operator),
    isDemo: pkg.isDemo,
  };
}

async function approvedOperatorMap(filter = {}) {
  const ops = await Operator.find({ status: 'approved', ...filter }).lean();
  return new Map(ops.map((o) => [String(o._id), o]));
}

async function departuresByPackage(packageIds) {
  const deps = await TripDeparture.find({ package: { $in: packageIds }, ...upcomingFilter() }).sort({ startDate: 1 }).lean();
  const map = new Map();
  for (const d of deps) {
    const k = String(d.package);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(d);
  }
  return map;
}

// Public summary of a linked place (India content directory), as shown on cards.
const placeOut = (p) => ({ slug: p.slug, name: p.name, kind: p.kind, placeType: p.placeType, state: p.state, theme: p.theme?.palette ? { name: p.theme.name, palette: p.theme.palette } : undefined });

// Resolves TripPackage.destinationRefs / departureCityRefs for many packages in two queries.
async function placeLookup(pkgs) {
  const ids = [...new Set(pkgs.flatMap((p) => [...(p.destinationRefs || []), ...(p.departureCityRefs || [])]).map(String))];
  if (!ids.length) return { places: new Map(), landscapes: new Map() };
  const [places, landscapes] = await Promise.all([
    Place.find({ _id: { $in: ids }, contentStatus: 'published' }, 'slug name kind placeType state theme landscapes').lean(),
    Landscape.find({ contentStatus: 'published' }, 'slug').lean(),
  ]);
  return { places: new Map(places.map((p) => [String(p._id), p])), landscapes: new Map(landscapes.map((l) => [String(l._id), l.slug])) };
}

function withPlaces(card, pkg, lookup) {
  const resolve = (ids) => (ids || []).map((id) => lookup.places.get(String(id))).filter(Boolean);
  const dest = resolve(pkg.destinationRefs);
  return {
    ...card,
    places: { destinations: dest.map(placeOut), departureCities: resolve(pkg.departureCityRefs).map(placeOut) },
    landscapes: [...new Set(dest.flatMap((p) => (p.landscapes || []).map((id) => lookup.landscapes.get(String(id))).filter(Boolean)))],
  };
}

async function listCards(pkgQuery, { limit } = {}) {
  const opMap = await approvedOperatorMap();
  const pkgs = await TripPackage.find({ $and: [pkgQuery, { status: 'published', operator: { $in: [...opMap.keys()] } }] })
    .sort({ createdAt: -1 })
    .limit(limit || 500)
    .lean();
  const [depMap, lookup] = await Promise.all([departuresByPackage(pkgs.map((p) => p._id)), placeLookup(pkgs)]);
  return pkgs.map((p) => ({
    card: withPlaces(presentCard(p, depMap.get(String(p._id)) || [], opMap.get(String(p.operator))), p, lookup),
    deps: depMap.get(String(p._id)) || [],
    pkg: p,
  }));
}

async function ratingSummary(packageId) {
  const reviews = await Review.find({ package: packageId, hidden: false }).populate('user', 'name').sort({ createdAt: -1 }).lean();
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  return {
    average: avg ? Math.round(avg * 10) / 10 : null,
    count: reviews.length,
    items: reviews.map((r) => ({ _id: r._id, rating: r.rating, comment: r.comment, createdAt: r.createdAt, author: r.user ? r.user.name.split(' ')[0] : 'Traveller' })),
  };
}

module.exports = { isVerified, placeLookup, withPlaces, availabilityOf, publicOperator, presentCard, presentDeparture, isBookable, listCards, departuresByPackage, approvedOperatorMap, ratingSummary, upcomingFilter };
