const express = require("express")
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getCategories,
  searchEvents,
  getEventAnalytics,
} = require("../controllers/eventController")
const { auth, authorize } = require("../middleware/auth")

const router = express.Router()

// Public routes
router.get("/", getEvents)
router.get("/categories", getCategories)
router.get("/search", searchEvents)
router.get("/:id", getEvent)

// Protected routes
router.post("/", auth, authorize("organizer", "admin"), createEvent)
router.put("/:id", auth, authorize("organizer", "admin"), updateEvent)
router.delete("/:id", auth, authorize("organizer", "admin"), deleteEvent)

// Organizer routes
router.get("/organizer/my-events", auth, authorize("organizer", "admin"), getOrganizerEvents)
router.get("/:id/analytics", auth, authorize("organizer", "admin"), getEventAnalytics)

module.exports = router
