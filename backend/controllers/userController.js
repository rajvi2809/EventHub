const User = require("../models/User");
const Booking = require("../models/Booking");
const Event = require("../models/Event");

// Get user profile by ID (public profile)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId).select(
      "-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's event statistics
    const eventStats = await Event.aggregate([
      { $match: { organizer: user._id } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalTicketsSold: {
            $sum: {
              $reduce: {
                input: "$ticketTypes",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.sold"] },
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        stats: eventStats[0] || {
          totalEvents: 0,
          totalTicketsSold: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user profile",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get user's events (for organizers)
const getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build query
    const query = { organizer: userId };
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate("organizer", "firstName lastName avatar")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      events,
    });
  } catch (error) {
    console.error("Get user events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user events",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build query
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("event", "title startDate endDate venue images")
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      bookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user bookings",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Update user avatar
const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: "Avatar URL is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      {
        new: true,
        runValidators: true,
      }
    );

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
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating avatar",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Update user profile (name, bio, location, phone)
const updateProfile = async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'bio', 'location', 'phone'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');

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
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile', error: process.env.NODE_ENV === 'development' ? error.message : {} });
  }
};

// Deactivate user account
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to deactivate account",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Deactivate account
    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deactivating account",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get booking statistics with event lookup to check upcoming events
    const bookingStats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventData",
        },
      },
      {
        $unwind: {
          path: "$eventData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          upcomingBookings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$eventData.startDate", new Date()] },
                    { $eq: ["$status", "confirmed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get event statistics (if user is organizer)
    const eventStats = await Event.aggregate([
      { $match: { organizer: userId } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalTicketsSold: {
            $sum: {
              $reduce: {
                input: "$ticketTypes",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.sold"] },
              },
            },
          },
          upcomingEvents: {
            $sum: {
              $cond: [{ $gte: ["$startDate", new Date()] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        bookings: bookingStats[0] || {
          totalBookings: 0,
          totalSpent: 0,
          upcomingBookings: 0,
        },
        events: eventStats[0] || {
          totalEvents: 0,
          totalTicketsSold: 0,
          upcomingEvents: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user statistics",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

module.exports = {
  getUserProfile,
  getUserEvents,
  getUserBookings,
  updateAvatar,
  deactivateAccount,
  getUserStats,
  updateProfile,
};
