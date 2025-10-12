const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: [
        "booking_confirmation",
        "event_reminder",
        "event_update",
        "event_cancelled",
        "payment_success",
        "payment_failed",
        "refund_processed",
        "review_request",
        "new_event_recommendation",
        "system_announcement",
      ],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [1000, "Message cannot be more than 1000 characters"],
    },
    data: {
      eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
      actionUrl: String,
      actionText: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    sentAt: Date,
    deliveredAt: Date,
    failureReason: String,
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
notificationSchema.index({ user: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ status: 1 })
notificationSchema.index({ isRead: 1 })
notificationSchema.index({ scheduledFor: 1 })
notificationSchema.index({ createdAt: -1 })

module.exports = mongoose.model("Notification", notificationSchema)
