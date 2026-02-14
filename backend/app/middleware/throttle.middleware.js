const rateLimitStore = new Map();

function getKey(req, scope) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  return `${scope}:${ip}`;
}

function throttle({ windowMs = 60 * 1000, max = 5, scope = 'default' } = {}) {
  return (req, res, next) => {
    const key = getKey(req, scope);
    const now = Date.now();
    const entry = rateLimitStore.get(key) || { count: 0, expiresAt: now + windowMs };

    if (now > entry.expiresAt) {
      entry.count = 0;
      entry.expiresAt = now + windowMs;
    }

    entry.count += 1;
    rateLimitStore.set(key, entry);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.floor(entry.expiresAt / 1000));

    if (entry.count > max) {
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }

    next();
  };
}

function cleanupStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.expiresAt + 5 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupStaleEntries, 5 * 60 * 1000);

module.exports = {
  throttle,
};
