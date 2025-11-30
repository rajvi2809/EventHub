const express = require("express");
const {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  requestCancelBooking,
  rejectCancellationRequest,
  getEventBookings,
} = require("../controllers/bookingController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// All booking routes require authentication
router.use(auth);

router.post("/", createBooking);
router.get("/", getUserBookings);
router.get("/:id", getBooking);
router.put("/:id/cancel", cancelBooking);

// Request cancellation (by user)
router.post("/:id/request-cancel", requestCancelBooking);

// Organizer can reject a cancellation request
router.put("/:id/reject-request", rejectCancellationRequest);

// Organizer routes
router.get(
  "/event/:eventId",
  authorize("organizer", "admin"),
  getEventBookings
);

module.exports = router;
