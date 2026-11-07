/* AI discovery (public).
     GET  /api/discover/status            { ai: boolean }
     POST /api/discover/interpret          { text } → { prefs, summary, ambiguities, mode, notice? }
     POST /api/discover/search             { prefs } → { summary, results, alternatives, explanation }
     POST /api/discover/trips/:slug/ask    { question } → { answered, answer, sources, mode, notice? }
   Search never calls an AI provider: it is deterministic over published packages and live
   inventory. Interpretation and answers fall back to rule-based logic without a key. */
const router = require('express').Router();
const { TripPackage, Operator, Place, TripDeparture } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { badRequest, notFoundErr } = require('../utils/http');
const { rateLimit } = require('../middleware/rateLimit');
const { status } = require('../services/ai/provider');
const { interpret } = require('../services/discovery/interpret');
const { normalisePrefs, summarise } = require('../services/discovery/prefs');
const { searchTrips } = require('../services/discovery/engine');
const { askTrip, buildContext } = require('../services/discovery/ask');

const aiLimiter = rateLimit({ windowMs: 60000, max: Number(process.env.AI_RATE_LIMIT_PER_MIN) || 20, name: 'ai' });
const searchLimiter = rateLimit({ windowMs: 60000, max: 60, name: 'search' });

let placeCache = { at: 0, places: [] };
async function placeIndex() {
  if (Date.now() - placeCache.at < 5 * 60000 && placeCache.places.length) return placeCache.places;
  const places = await Place.find({ contentStatus: 'published' }, 'slug name kind aliases').lean();
  placeCache = { at: Date.now(), places };
  return places;
}

router.get('/status', (req, res) => res.json({ success: true, data: { ai: status().configured } }));

router.post('/interpret', aiLimiter, asyncHandler(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (text.length < 3) throw badRequest('Tell us a little about the trip you want');
  if (text.length > 500) throw badRequest('Please keep it under 500 characters');
  const out = await interpret(text, { places: await placeIndex() });
  res.json({ success: true, data: { ...out, summary: summarise(out.prefs) } });
}));

router.post('/search', searchLimiter, asyncHandler(async (req, res) => {
  const prefs = normalisePrefs(req.body?.prefs || {});
  const out = await searchTrips(prefs);
  res.json({
    success: true,
    data: {
      prefs,
      summary: summarise(prefs),
      results: out.results,
      alternatives: out.alternatives,
      explanation: out.explanation,
      counts: { published: out.counts.published, exact: out.counts.exact },
    },
  });
}));

router.post('/trips/:slug/ask', aiLimiter, optionalAuth, asyncHandler(async (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (question.length < 3) throw badRequest('Ask a question about this trip');
  if (question.length > 300) throw badRequest('Please keep questions under 300 characters');
  const pkg = await TripPackage.findOne({ slug: req.params.slug }).lean();
  const operator = pkg && await Operator.findById(pkg.operator).lean();
  const isPublic = pkg && pkg.status === 'published' && operator?.status === 'approved';
  const isOwner = pkg && req.user && operator && String(operator.owner) === String(req.user._id);
  if (!isPublic && !isOwner && req.user?.role !== 'admin') throw notFoundErr('Trip not found');
  const deps = await TripDeparture.find({ package: pkg._id, status: { $ne: 'cancelled' }, startDate: { $gte: new Date() } }).sort({ startDate: 1 }).lean();
  const answer = await askTrip(buildContext(pkg, deps, operator), question);
  res.json({ success: true, data: answer });
}));

module.exports = router;
