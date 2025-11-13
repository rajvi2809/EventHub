const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const {
  createReview,
  getEventReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  voteReview,
  reportReview,
  moderateReview,
  getPendingReviews,
} = require("../controllers/reviewController");

// Public routes
router.get("/event/:eventId", getEventReviews);
router.get("/user/:userId", getUserReviews);

// Protected routes (require authentication)
router.post("/", auth, createReview);
router.put("/:reviewId", auth, updateReview);
router.delete("/:reviewId", auth, deleteReview);
router.post("/:reviewId/vote", auth, voteReview);
router.post("/:reviewId/report", auth, reportReview);

// Admin only routes
router.get("/admin/pending", auth, authorize("admin"), getPendingReviews);
router.put("/:reviewId/moderate", auth, authorize("admin"), moderateReview);

module.exports = router;
