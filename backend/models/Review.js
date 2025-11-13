const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event is required"],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot be more than 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [1000, "Review comment cannot be more than 1000 characters"],
    },
    aspects: {
      organization: {
        type: Number,
        min: [1, "Organization rating must be at least 1"],
        max: [5, "Organization rating cannot be more than 5"],
      },
      venue: {
        type: Number,
        min: [1, "Venue rating must be at least 1"],
        max: [5, "Venue rating cannot be more than 5"],
      },
      content: {
        type: Number,
        min: [1, "Content rating must be at least 1"],
        max: [5, "Content rating cannot be more than 5"],
      },
      value: {
        type: Number,
        min: [1, "Value rating must be at least 1"],
        max: [5, "Value rating cannot be more than 5"],
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderationNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to ensure one review per user per event
reviewSchema.index({ user: 1, event: 1 }, { unique: true });

// Indexes for performance
reviewSchema.index({ event: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ moderationStatus: 1 });

module.exports = mongoose.model("Review", reviewSchema);
