const attemptsByIp = new Map()
const windowMs = 15 * 60 * 1000
const maxAttempts = 5

const passwordResetRateLimit = (req, res, next) => {
  const now = Date.now()
  const ip = req.ip
  let attempts = attemptsByIp.get(ip)

  if (!attempts || attempts.expiresAt <= now) {
    attempts = { count: 0, expiresAt: now + windowMs }
    attemptsByIp.set(ip, attempts)
  }

  attempts.count += 1
  if (attempts.count > maxAttempts) {
    return res.status(429).json({ message: 'בוצעו יותר מדי ניסיונות. נסו שוב בעוד 15 דקות.' })
  }

  if (attemptsByIp.size > 10000) {
    for (const [storedIp, entry] of attemptsByIp) {
      if (entry.expiresAt <= now) {
        attemptsByIp.delete(storedIp)
      }
    }
    while (attemptsByIp.size > 10000) {
      attemptsByIp.delete(attemptsByIp.keys().next().value)
    }
  }

  return next()
}

module.exports = passwordResetRateLimit
