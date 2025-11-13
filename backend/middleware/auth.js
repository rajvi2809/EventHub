const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const { getRedisClient } = require("../config/redis");

const auth = async (req, res, next) => {
  try {
    // Try to get token from Authorization header
    let token = req.header("Authorization");

    // Also try from x-auth-token header (alternative)
    if (!token) {
      token = req.header("x-auth-token");
    }

    // Also try from cookies
    if (!token) {
      token = req.cookies?.token;
    }

    // Extract token if it has "Bearer " prefix
    if (token && token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "").trim();
    } else if (token) {
      token = token.trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // Check if token is blacklisted in Redis
    // const redisClient = getRedisClient();
    // if (redisClient) {
    //   const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    //   if (isBlacklisted) {
    //     return res.status(401).json({
    //       success: false,
    //       message: "Token has been invalidated"
    //     });
    //   }
    // }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid - user not found",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { auth, authorize };
