const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { getRedisClient } = require("../config/redis")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    // Check if token is blacklisted in Redis
    const redisClient = getRedisClient()
    if (redisClient) {
      const isBlacklisted = await redisClient.get(`blacklist_${token}`)
      if (isBlacklisted) {
        return res.status(401).json({ message: "Token has been invalidated" })
      }
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" })
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      })
    }
    next()
  }
}

module.exports = { auth, authorize }
