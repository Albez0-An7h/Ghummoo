/* Small in-memory fixed-window rate limiter, per IP by default or per `key(req)` (single-instance deployment; no extra
   dependency). Returns 429 with Retry-After when the limit is exceeded. */
function rateLimit({ windowMs = 60000, max = 20, name = 'default', key = (req) => req.ip } = {}) {
  const hits = new Map(); // ip -> { count, reset }
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs);
  sweep.unref?.();

  return function limiter(req, res, next) {
    if (process.env.RATE_LIMIT === 'off') return next();
    const now = Date.now();
    const k = `${name}:${key(req)}`;
    let entry = hits.get(k);
    if (!entry || entry.reset <= now) { entry = { count: 0, reset: now + windowMs }; hits.set(k, entry); }
    entry.count += 1;
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.' });
    }
    return next();
  };
}

module.exports = { rateLimit };
