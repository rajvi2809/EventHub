const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { getRedisClient } = require("../config/redis")
const { sendEmail } = require("../utils/email")

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)

  const options = {
    expires: new Date(Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === "production") {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    })
}

// Register user with OTP
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || "attendee",
      phone,
      isVerified: false,
    })

    // Generate OTP
    const otp = generateOTP()
    user.otp = otp
    user.otpExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save({ validateBeforeSave: false })

    // Send OTP email
    await sendEmail({
      email: user.email,
      subject: "Your EventHub OTP Verification Code",
      message: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    })

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      userId: user._id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" })
    }
    if (!user.otp || !user.otpExpire || user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" })
    }

    user.isVerified = true
    user.otp = undefined
    user.otpExpire = undefined
    await user.save({ validateBeforeSave: false })

    res.status(200).json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error verifying OTP" })
  }
}

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" })
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified" })
    }
    const otp = generateOTP()
    user.otp = otp
    user.otpExpire = Date.now() + 10 * 60 * 1000
    await user.save({ validateBeforeSave: false })

    await sendEmail({
      email: user.email,
      subject: "Your EventHub OTP Verification Code",
      message: `Your OTP code is: ${otp}. It will expire in 10 minutes.`,
    })

    res.status(200).json({ success: true, message: "OTP resent successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error resending OTP" })
  }
}

// Login user (only if verified)
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated",
      })
    }

    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    sendTokenResponse(user, 200, res)
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Logout user
const logout = async (req, res) => {
  try {
    const token = req.token

    // Add token to Redis blacklist
    const redisClient = getRedisClient()
    if (redisClient) {
      // Set token in blacklist with expiration matching JWT expiration
      const decoded = jwt.decode(token)
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)

      if (expiresIn > 0) {
        await redisClient.setEx(`blacklist_${token}`, expiresIn, "true")
      }
    }

    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Get current logged in user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error getting profile",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      bio: req.body.bio,
      location: req.body.location,
      preferences: req.body.preferences,
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach((key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key])

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      })
    }

    const user = await User.findById(req.user.id).select("+password")

    // Check current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    user.password = newPassword
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error changing password",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with that email",
      })
    }

    // Get reset token
    const resetToken = crypto.randomBytes(20).toString("hex")

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set expire
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

    await user.save({ validateBeforeSave: false })

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/resetpassword/${resetToken}`

    try {
      await sendEmail({
        email: user.email,
        subject: "EventHub - Password Reset",
        message: `You are receiving this email because you requested a password reset. Please make a PUT request to: ${resetUrl}`,
      })

      res.status(200).json({
        success: true,
        message: "Email sent successfully",
      })
    } catch (err) {
      console.log("Email could not be sent:", err.message)
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined

      await user.save({ validateBeforeSave: false })

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      })
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error processing forgot password",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Reset password
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex")

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      })
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Verify email (token-based, not OTP)
const verifyEmail = async (req, res) => {
  try {
    const verificationToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = await User.findOne({
      verificationToken,
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      })
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Verify email error:", error)
    res.status(500).json({
      success: false,
      message: "Server error verifying email",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

module.exports = {
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
}