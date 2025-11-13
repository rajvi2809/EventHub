const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyOTP,
  resendOTP,
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  profileUpdateValidation,
  validate,
} = require("../middleware/validation");

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.put("/profile", auth, profileUpdateValidation, validate, updateProfile);
router.put(
  "/change-password",
  auth,
  changePasswordValidation,
  validate,
  changePassword
);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);
router.get("/verify/:token", verifyEmail);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

module.exports = router;
