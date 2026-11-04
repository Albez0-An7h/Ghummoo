const router = require('express').Router();
const { Report } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { badRequest } = require('../utils/http');

router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body || {};
  if (!['package', 'operator', 'booking'].includes(targetType) || !targetId) throw badRequest('Invalid report target');
  if (!['misleading', 'pricing', 'safety', 'fraud', 'other'].includes(reason)) throw badRequest('Please choose a reason');
  const report = await Report.create({ reporter: req.user._id, targetType, targetId, reason, details: String(details || '').slice(0, 2000) });
  res.status(201).json({ success: true, data: report });
}));

module.exports = router;
