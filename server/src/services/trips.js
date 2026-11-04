const { Operator, TripPackage, TripDeparture, Review } = require('../models');

const publicOperator = (op) => op && ({
  _id: op._id,
  businessName: op.businessName,
  slug: op.slug,
  location: op.location,
  logoUrl: op.logoUrl,
  verified: Boolean(op.verifiedAt),
  isDemo: op.isDemo,
});

const upcomingFilter = () => ({ status: { $ne: 'cancelled' }, startDate: { $gte: new Date() } });

const isBookable = (d) => {
  const now = new Date();
  const deadline = d.bookingDeadline || d.startDate;
  return d.status === 'open' && d.seatsAvailable > 0 && new Date(deadline) >= now && new Date(d.startDate) >= now;
};

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

async function listCards(pkgQuery, { limit } = {}) {
  const opMap = await approvedOperatorMap();
  const pkgs = await TripPackage.find({ $and: [pkgQuery, { status: 'published', operator: { $in: [...opMap.keys()] } }] })
    .sort({ createdAt: -1 })
    .limit(limit || 500)
    .lean();
  const depMap = await departuresByPackage(pkgs.map((p) => p._id));
  return pkgs.map((p) => ({ card: presentCard(p, depMap.get(String(p._id)) || [], opMap.get(String(p.operator))), deps: depMap.get(String(p._id)) || [] }));
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

module.exports = { publicOperator, presentCard, presentDeparture, isBookable, listCards, departuresByPackage, approvedOperatorMap, ratingSummary, upcomingFilter };
