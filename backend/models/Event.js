const mongoose = require("mongoose")

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Ticket type name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Ticket price is required"],
    min: [0, "Price cannot be negative"],
  },
  quantity: {
    type: Number,
    required: [true, "Ticket quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  sold: {
    type: Number,
    default: 0,
    min: [0, "Sold tickets cannot be negative"],
  },
  maxPerOrder: {
    type: Number,
    default: 10,
    min: [1, "Max per order must be at least 1"],
  },
  saleStartDate: {
    type: Date,
    default: Date.now,
  },
  saleEndDate: {
    type: Date,
    required: [true, "Sale end date is required"],
  },
})

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: [5000, "Description cannot be more than 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [300, "Short description cannot be more than 300 characters"],
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      enum: [
        "conference",
        "workshop",
        "seminar",
        "networking",
        "concert",
        "festival",
        "sports",
        "exhibition",
        "webinar",
        "meetup",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event organizer is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Event end date is required"],
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    venue: {
      type: {
        type: String,
        enum: ["physical", "online", "hybrid"],
        required: [true, "Venue type is required"],
      },
      name: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      onlineDetails: {
        platform: String,
        link: String,
        accessInstructions: String,
      },
    },
    images: [
      {
        url: String,
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    ticketTypes: [ticketTypeSchema],
    capacity: {
      type: Number,
      min: [1, "Capacity must be at least 1"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    refundPolicy: {
      type: String,
      maxlength: [1000, "Refund policy cannot be more than 1000 characters"],
    },
    additionalInfo: {
      type: String,
      maxlength: [2000, "Additional info cannot be more than 2000 characters"],
    },
    socialLinks: {
      website: String,
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      uniqueViews: {
        type: Number,
        default: 0,
      },
      shares: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for total tickets sold
eventSchema.virtual("totalTicketsSold").get(function () {
  return this.ticketTypes.reduce((total, ticket) => total + ticket.sold, 0)
})

// Virtual for total revenue
eventSchema.virtual("totalRevenue").get(function () {
  return this.ticketTypes.reduce((total, ticket) => total + ticket.price * ticket.sold, 0)
})

// Virtual for available tickets
eventSchema.virtual("availableTickets").get(function () {
  return this.ticketTypes.reduce((total, ticket) => total + (ticket.quantity - ticket.sold), 0)
})

// Virtual for reviews
eventSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "event",
})

// Virtual for bookings
eventSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "event",
})

// Indexes for performance
eventSchema.index({ organizer: 1 })
eventSchema.index({ category: 1 })
eventSchema.index({ startDate: 1 })
eventSchema.index({ status: 1 })
eventSchema.index({ "venue.address.city": 1 })
eventSchema.index({ tags: 1 })
eventSchema.index({ title: "text", description: "text" })

// Validate end date is after start date
eventSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"))
  }
  next()
})

module.exports = mongoose.model("Event", eventSchema)
