const jwt = require('jsonwebtoken')
const User = require('../models/User')

const verifyJWT = (...allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Forbidden' })

      try {
        const user = await User.findById(decoded._id).select('role').lean()
        if (!user) return res.status(401).json({ message: 'Unauthorized' })

        req.user = { ...decoded, role: user.role }

        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
          return res.status(403).json({ message: 'Forbidden' })
        }

        next()
      } catch (error) {
        next(error)
      }
    })
  }
}

module.exports = verifyJWT
