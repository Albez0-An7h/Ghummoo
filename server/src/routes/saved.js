// Saved trips for travellers. Stores package references on the user; listing goes through
// listCards, so unpublished or removed trips silently drop out of the saved list.
const router = require('express').Router();
const { User, TripPackage, Operator } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/errorHandler');
const { notFoundErr, conflict } = require('../utils/http');
const { listCards } = require('../services/trips');

const MAX_SAVED = 100;

router.use(verifyToken, requireRole('traveler'));

async function savedIds(userId) {
  const u = await User.findById(userId).select('+savedTrips').lean();
  return (u?.savedTrips || []).map(String);
}

// GET /api/saved: saved trips as cards, newest save first.
router.get('/', asyncHandler(async (req, res) => {
  const ids = await savedIds(req.user._id);
  const rows = ids.length ? await listCards({ _id: { $in: ids } }) : [];
  const order = new Map(ids.map((id, i) => [id, i]));
  const items = rows.map((r) => r.card).sort((a, b) => order.get(String(b._id)) - order.get(String(a._id)));
  res.json({ success: true, data: { items, slugs: items.map((c) => c.slug), unavailable: ids.length - items.length } });
}));

async function publishedBySlug(slug) {
  const pkg = await TripPackage.findOne({ slug, status: 'published' }, '_id operator slug').lean();
  if (!pkg || !(await Operator.exists({ _id: pkg.operator, status: 'approved' }))) throw notFoundErr('Trip not found');
  return pkg;
}

// PUT /api/saved/:slug: save (idempotent).
router.put('/:slug', asyncHandler(async (req, res) => {
  const pkg = await publishedBySlug(req.params.slug);
  const updated = await User.findOneAndUpdate(
    { _id: req.user._id, [`savedTrips.${MAX_SAVED - 1}`]: { $exists: false } },
    { $addToSet: { savedTrips: pkg._id } },
    { new: true }
  ).select('+savedTrips');
  if (!updated) {
    const ids = await savedIds(req.user._id);
    if (!ids.includes(String(pkg._id))) throw conflict(`You can save up to ${MAX_SAVED} trips`);
  }
  res.json({ success: true, data: { slug: pkg.slug, saved: true } });
}));

// DELETE /api/saved/:slug: unsave (idempotent; works even if the trip was unpublished).
router.delete('/:slug', asyncHandler(async (req, res) => {
  const pkg = await TripPackage.findOne({ slug: req.params.slug }, '_id slug').lean();
  if (pkg) await User.updateOne({ _id: req.user._id }, { $pull: { savedTrips: pkg._id } });
  res.json({ success: true, data: { slug: req.params.slug, saved: false } });
}));

module.exports = router;
