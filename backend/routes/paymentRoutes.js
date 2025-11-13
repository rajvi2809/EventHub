const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { auth } = require("../middleware/auth");

// All payment routes require authentication
router.use(auth);

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

module.exports = router;
