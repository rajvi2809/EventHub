const Review = require("../models/Review");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { eventId, bookingId, rating, title, comment, aspects } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!eventId || !bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Event ID, booking ID, rating, and comment are required",
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      event: eventId,
      status: "confirmed",
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "Booking not found or not confirmed",
      });
    }

    // Check if event has already ended or is marked as completed
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Allow reviews if event is completed OR if the end date has passed
    if (event.status !== 'completed' && new Date(event.endDate) > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot review an event that hasn't ended yet",
      });
    }

    // Check if user has already reviewed this event
    const existingReview = await Review.findOne({
      user: userId,
      event: eventId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this event",
      });
    }

    
    const review = await Review.create({
      user: userId,
      event: eventId,
      booking: bookingId,
      rating,
      title,
      comment,
      aspects,
      moderationStatus: "approved",
    });

    // Populate the review with user and event details
    await review.populate([
      { path: "user", select: "firstName lastName avatar" },
      { path: "event", select: "title startDate endDate venue" },
    ]);

    // Update event's average rating
    await updateEventRating(eventId);

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get reviews for an event
const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, sort = "newest", rating } = req.query;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Build query
    const query = {
      event: eventId,
      isPublic: true,
      moderationStatus: "approved",
    };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Build sort
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "highest") {
      sortOption = { rating: -1 };
    } else if (sort === "lowest") {
      sortOption = { rating: 1 };
    } else if (sort === "helpful") {
      sortOption = { helpfulVotes: -1 };
    }

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName avatar")
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          event: event._id,
          isPublic: true,
          moderationStatus: "approved",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      reviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Get event reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting event reviews",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const reviews = await Review.find({ user: userId })
      .populate("event", "title startDate endDate venue images")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      reviews,
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user reviews",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, aspects } = req.body;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to update it",
      });
    }

    // Update review fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (aspects !== undefined) review.aspects = aspects;

    // Reset moderation status when updating
    review.moderationStatus = "pending";

    await review.save();

    // Update event's average rating
    await updateEventRating(review.event);

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    const eventId = review.event;
    await Review.findByIdAndDelete(reviewId);

    // Update event's average rating
    await updateEventRating(eventId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Vote on review helpfulness
const voteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful } = req.body;
    const userId = req.user.id;

    if (typeof helpful !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Helpful must be a boolean value",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user has already voted (you might want to implement this)
    // For now, we'll just update the vote count
    if (helpful) {
      review.helpfulVotes += 1;
    } else {
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpfulVotes: review.helpfulVotes,
    });
  } catch (error) {
    console.error("Vote review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error voting on review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Report a review
const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user has already reported this review
    // You might want to implement a separate Report model for this
    review.reportCount += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review reported successfully",
    });
  } catch (error) {
    console.error("Report review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error reporting review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Moderate review (Admin only)
const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { moderationStatus, moderationNotes } = req.body;

    // Validate moderation status
    if (!["approved", "rejected", "pending"].includes(moderationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moderation status. Must be 'approved', 'rejected', or 'pending'",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Update moderation status
    review.moderationStatus = moderationStatus;
    if (moderationNotes) {
      review.moderationNotes = moderationNotes;
    }
    await review.save();

    // Update event's average rating if status changed
    if (moderationStatus === "approved" || moderationStatus === "rejected") {
      await updateEventRating(review.event);
    }

    res.status(200).json({
      success: true,
      message: `Review ${moderationStatus} successfully`,
      review,
    });
  } catch (error) {
    console.error("Moderate review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error moderating review",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get all reviews for moderation (Admin only)
const getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "pending" } = req.query;

    const query = {};
    if (status && status !== "all") {
      query.moderationStatus = status;
    }

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName email")
      .populate("event", "title startDate endDate")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      reviews,
    });
  } catch (error) {
    console.error("Get pending reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting reviews for moderation",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Helper function to update event's average rating
const updateEventRating = async (eventId) => {
  try {
    const result = await Review.aggregate([
      {
        $match: {
          event: eventId,
          isPublic: true,
          moderationStatus: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      await Event.findByIdAndUpdate(eventId, {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews,
      });
    }
  } catch (error) {
    console.error("Update event rating error:", error);
  }
};

module.exports = {
  createReview,
  getEventReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  voteReview,
  reportReview,
  moderateReview,
  getPendingReviews,
};
