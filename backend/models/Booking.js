const mongoose = require("mongoose")

const bookingItemSchema = new mongoose.Schema({
  ticketType: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Ticket type is required"],
  },
  ticketTypeName: {
    type: String,
    required: [true, "Ticket type name is required"],
  },
  price: {
    type: Number,
    required: [true, "Ticket price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
  },
})

const attendeeSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
  },
  phone: String,
  ticketCode: {
    type: String,
    unique: true,
    required: [true, "Ticket code is required"],
  },
  checkedIn: {
    type: Boolean,
    default: false,
  },
  checkInTime: Date,
})

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      unique: true,
      required: [true, "Booking number is required"],
    },
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
    items: [bookingItemSchema],
    attendees: [attendeeSchema],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    platformFee: {
      type: Number,
      default: 0,
      min: [0, "Platform fee cannot be negative"],
    },
    processingFee: {
      type: Number,
      default: 0,
      min: [0, "Processing fee cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refunded"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "razorpay"],
      required: [true, "Payment method is required"],
    },
    paymentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentOrder",
    },
    paymentDetails: {
      transactionId: String,
      paymentGateway: String,
      last4Digits: String,
      paymentDate: Date,
    },
    billingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot be more than 500 characters"],
    },
    refundDetails: {
      refundAmount: Number,
      refundDate: Date,
      refundReason: String,
      refundTransactionId: String,
    },
    qrCode: String,
    downloadUrl: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for total tickets
bookingSchema.virtual("totalTickets").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Indexes for performance
bookingSchema.index({ user: 1 })
bookingSchema.index({ event: 1 })
bookingSchema.index({ bookingNumber: 1 })
bookingSchema.index({ status: 1 })
bookingSchema.index({ paymentStatus: 1 })
bookingSchema.index({ createdAt: -1 })

// Generate booking number before saving
bookingSchema.pre("save", function (next) {
  if (!this.bookingNumber) {
    this.bookingNumber = "BK" + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
  }
  next()
})

module.exports = mongoose.model("Booking", bookingSchema)
