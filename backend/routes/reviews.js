const express = require("express")
const router = express.Router()

// Placeholder routes - will be implemented in later tasks
router.get("/:eventId", (req, res) => {
  res.json({ message: "Get reviews endpoint - to be implemented" })
})

router.post("/", (req, res) => {
  res.json({ message: "Create review endpoint - to be implemented" })
})

module.exports = router
