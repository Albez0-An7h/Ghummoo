const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { asyncHandler } = require('../middleware/errorHandler');
const { badRequest } = require('../utils/http');
const ai = require('../services/ai');

router.use(verifyToken, requireRole('operator', 'admin'));

router.get('/status', (req, res) => res.json({ success: true, data: ai.status() }));

router.post('/extract-package', asyncHandler(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (text.length < 30) throw badRequest('Paste at least a few lines of the package description');
  if (text.length > 8000) throw badRequest('Text is too long (max 8,000 characters)');
  const result = await ai.extractPackage(text);
  res.json({ success: true, data: result });
}));

module.exports = router;
