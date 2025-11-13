const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getUserProfile,
  getUserEvents,
  getUserBookings,
  updateAvatar,
  deactivateAccount,
  getUserStats,
} = require("../controllers/userController");

const { updateProfile } = require("../controllers/userController");

// Public routes
router.get("/:userId/profile", getUserProfile);
router.get("/:userId/events", getUserEvents);
router.get("/:userId/bookings", getUserBookings);

// Protected routes (require authentication)
router.get("/profile", auth, getUserProfile);
router.get("/events", auth, getUserEvents);
router.get("/bookings", auth, getUserBookings);
router.get("/stats", auth, getUserStats);
router.put("/avatar", auth, updateAvatar);
router.put("/deactivate", auth, deactivateAccount);
router.put("/profile", auth, updateProfile);

module.exports = router;
