const router = require('express').Router();
const { Operator, Review } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { notFoundErr } = require('../utils/http');
const { listCards, publicOperator } = require('../services/trips');

router.get('/:slug', asyncHandler(async (req, res) => {
  const op = await Operator.findOne({ slug: req.params.slug, status: 'approved' }).lean();
  if (!op) throw notFoundErr('Organiser not found');
  const rows = await listCards({ operator: op._id });
  const reviews = await Review.find({ operator: op._id, hidden: false }).lean();
  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : null;
  res.json({
    success: true,
    data: {
      ...publicOperator(op),
      description: op.description,
      contactEmail: op.contactEmail,
      contactPhone: op.contactPhone,
      instagram: op.instagram,
      website: op.website,
      foundedYear: op.foundedYear,
      memberSince: op.createdAt,
      rating: { average: avg, count: reviews.length },
      trips: rows.map((r) => r.card),
    },
  });
}));

module.exports = router;
