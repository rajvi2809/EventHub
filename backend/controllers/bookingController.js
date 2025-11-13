const Booking = require("../models/Booking")
const Event = require("../models/Event")
const User = require("../models/User")
const { generateTicketCode, generateBookingNumber } = require("../utils/generateTicketCode")

// Create booking
const createBooking = async (req, res) => {
  try {
    const { eventId, items, attendees, billingAddress, paymentMethod, specialRequests } = req.body

    // Get event
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if event is published and not cancelled
    if (event.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Event is not available for booking",
      })
    }

    // Validate ticket availability
    let totalAmount = 0
    const bookingItems = []

    for (const item of items) {
      const ticketType = event.ticketTypes.id(item.ticketTypeId)
      if (!ticketType) {
        return res.status(400).json({
          success: false,
          message: `Ticket type not found: ${item.ticketTypeId}`,
        })
      }

      // Check availability
      if (ticketType.sold + item.quantity > ticketType.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough tickets available for ${ticketType.name}`,
        })
      }

      // Check max per order
      if (item.quantity > ticketType.maxPerOrder) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${ticketType.maxPerOrder} tickets allowed per order for ${ticketType.name}`,
        })
      }

      const subtotal = ticketType.price * item.quantity
      totalAmount += subtotal

      bookingItems.push({
        ticketType: ticketType._id,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        quantity: item.quantity,
        subtotal,
      })
    }

    // Calculate fees
    const platformFee = totalAmount * 0.03 // 3% platform fee
    const processingFee = 2.5 // Fixed processing fee
    const finalAmount = totalAmount + platformFee + processingFee

    // Generate ticket codes for attendees
    const attendeesWithCodes = attendees.map((attendee) => ({
      ...attendee,
      ticketCode: generateTicketCode(),
    }))

    // Create booking
    const booking = await Booking.create({
      bookingNumber: generateBookingNumber(),
      user: req.user.id,
      event: eventId,
      items: bookingItems,
      attendees: attendeesWithCodes,
      totalAmount,
      platformFee,
      processingFee,
      finalAmount,
      paymentMethod,
      billingAddress,
      specialRequests,
      status: "confirmed", // In real app, would be "pending" until payment
      paymentStatus: "completed", // Mock payment success
      paymentDetails: {
        transactionId: `txn_${Date.now()}`,
        paymentGateway: "stripe",
        paymentDate: new Date(),
      },
    })

    // Update ticket sales
    for (const item of items) {
      await Event.findOneAndUpdate(
        { _id: eventId, "ticketTypes._id": item.ticketTypeId },
        { $inc: { "ticketTypes.$.sold": item.quantity } },
      )
    }

    await booking.populate([
      { path: "user", select: "firstName lastName email" },
      { path: "event", select: "title startDate venue" },
    ])

    res.status(201).json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(400).json({
      success: false,
      message: "Error creating booking",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { user: req.user.id }
    if (status) {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate("event", "title startDate endDate venue images")
      .populate("paymentOrder", "razorpayOrderId razorpayPaymentId paymentStatus amount")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(query)

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
    })
  } catch (error) {
    console.error("Get user bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Server error getting bookings",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate([
      { path: "user", select: "firstName lastName email" },
      { path: "event", select: "title startDate endDate venue organizer" },
      { path: "paymentOrder", select: "razorpayOrderId razorpayPaymentId paymentStatus amount" },
    ])

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if user owns the booking or is the event organizer or admin
    if (
      booking.user._id.toString() !== req.user.id &&
      booking.event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      })
    }

    res.status(200).json({
      success: true,
      booking,
    })
  } catch (error) {
    console.error("Get booking error:", error)
    res.status(500).json({
      success: false,
      message: "Server error getting booking",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("event")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      })
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      })
    }

    // Check cancellation policy (24 hours before event)
    const eventStart = new Date(booking.event.startDate)
    const now = new Date()
    const hoursUntilEvent = (eventStart - now) / (1000 * 60 * 60)

    if (hoursUntilEvent < 24) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel booking less than 24 hours before event",
      })
    }

    // Update booking status
    booking.status = "cancelled"
    booking.refundDetails = {
      refundAmount: booking.finalAmount,
      refundDate: new Date(),
      refundReason: "User cancellation",
      refundTransactionId: `ref_${Date.now()}`,
    }
    await booking.save()

    // Restore ticket availability
    for (const item of booking.items) {
      await Event.findOneAndUpdate(
        { _id: booking.event._id, "ticketTypes._id": item.ticketType },
        { $inc: { "ticketTypes.$.sold": -item.quantity } },
      )
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({
      success: false,
      message: "Server error cancelling booking",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

// Get event bookings (for organizers)
const getEventBookings = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view bookings for this event",
      })
    }

    const { page = 1, limit = 10, status } = req.query

    const query = { event: req.params.eventId }
    if (status) {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate("user", "firstName lastName email")
      .populate("paymentOrder", "razorpayOrderId razorpayPaymentId paymentStatus amount")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(query)

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
    })
  } catch (error) {
    console.error("Get event bookings error:", error)
    res.status(500).json({
      success: false,
      message: "Server error getting event bookings",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    })
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  getEventBookings,
}
