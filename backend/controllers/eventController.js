const Event = require("../models/Event");
const Booking = require("../models/Booking");
const User = require("../models/User");
// const { getRedisClient } = require("../config/redis")

// Get all events with filtering, sorting, and pagination
const getEvents = async (req, res) => {
  try {
    // Ensure events that have ended are marked as completed
    await Event.updateMany(
      { endDate: { $lte: new Date() }, status: 'published' },
      { $set: { status: 'completed' } }
    );
    const {
      page = 1,
      limit = 10,
      category,
      location,
      startDate,
      endDate,
      search,
      sort = "-createdAt",
      status = "published",
    } = req.query;

    // Build query
    const query = { status };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Location filter
    if (location) {
      query.$or = [
        { "venue.address.city": { $regex: location, $options: "i" } },
        { "venue.address.state": { $regex: location, $options: "i" } },
        { "venue.address.country": { $regex: location, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const events = await Event.find(query)
      .populate("organizer", "firstName lastName avatar")
      // include status so frontend can render the correct status instead of defaulting to the first <option>
      .select("title description startDate endDate venue category ticketTypes analytics images status organizer")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Event.countDocuments(query);

    // Add computed fields safely (guard against missing ticketTypes)
    const eventsWithDetails = events.map((event) => {
      const types = Array.isArray(event.ticketTypes) ? event.ticketTypes : [];
      const totalTicketsSold = types.reduce((sum, ticket) => sum + (Number(ticket?.sold) || 0), 0);
      const availableTickets = types.reduce((sum, ticket) => sum + Math.max(0, (Number(ticket?.quantity) || 0) - (Number(ticket?.sold) || 0)), 0);
      const prices = types.map((t) => Number(t?.price) || 0);
      return {
        ...event,
        totalTicketsSold,
        availableTickets,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    });

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      events: eventsWithDetails,
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting events",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get single event by ID
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "firstName lastName avatar bio"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Increment view count
    await Event.findByIdAndUpdate(req.params.id, {
      $inc: { "analytics.views": 1 },
    });

    // If event endDate has passed and it's still published, mark completed
    if (event && event.endDate && new Date(event.endDate) <= new Date() && event.status === 'published') {
      event.status = 'completed';
      await event.save();
    }

    // Add computed fields
    const eobj = event.toObject();
    const types = Array.isArray(eobj.ticketTypes) ? eobj.ticketTypes : [];
    // Reconcile sold counts from Booking records to ensure counts reflect confirmed bookings
    try {
      // Aggregate bookings for this event that are confirmed / completed payments
      const bookings = await Booking.find({ event: event._id, status: 'confirmed' }).lean();

      // Build sold map per ticketType id
      const soldMap = {};
      for (const b of bookings) {
        if (!Array.isArray(b.items)) continue;
        for (const it of b.items) {
          const ttId = String(it.ticketType);
          const qty = Number(it.quantity) || 0;
          soldMap[ttId] = (soldMap[ttId] || 0) + qty;
        }
      }

      // Create a copy of types and override sold values with aggregated numbers when available
      const reconciledTypes = types.map((t) => {
        const tCopy = { ...t };
        const id = String(tCopy._id || tCopy.id);
        if (soldMap[id] !== undefined) {
          tCopy.sold = soldMap[id];
        }
        // ensure sold is numeric
        tCopy.sold = Number(tCopy.sold) || 0;
        return tCopy;
      });

      const totalTicketsSold = reconciledTypes.reduce((sum, ticket) => sum + (Number(ticket?.sold) || 0), 0);
      const availableTickets = reconciledTypes.reduce((sum, ticket) => sum + Math.max(0, (Number(ticket?.quantity) || 0) - (Number(ticket?.sold) || 0)), 0);
      const totalRevenue = reconciledTypes.reduce((sum, ticket) => sum + (Number(ticket?.price) || 0) * (Number(ticket?.sold) || 0), 0);

      const eventWithDetails = {
        ...eobj,
        ticketTypes: reconciledTypes,
        totalTicketsSold,
        availableTickets,
        totalRevenue,
      };

      res.status(200).json({
        success: true,
        event: eventWithDetails,
      });
      return;
    } catch (reconErr) {
      console.error('Failed to reconcile booking counts for event:', reconErr);
      // fallback to using stored ticketTypes.sold values
    }

    const eventWithDetails = {
      ...eobj,
      totalTicketsSold: types.reduce((sum, ticket) => sum + (Number(ticket?.sold) || 0), 0),
      availableTickets: types.reduce((sum, ticket) => sum + Math.max(0, (Number(ticket?.quantity) || 0) - (Number(ticket?.sold) || 0)), 0),
      totalRevenue: types.reduce((sum, ticket) => sum + (Number(ticket?.price) || 0) * (Number(ticket?.sold) || 0), 0),
    };

    res.status(200).json({
      success: true,
      event: eventWithDetails,
    });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting event",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Create new event
const createEvent = async (req, res) => {
  try {
    // Add organizer to event data
    req.body.organizer = req.user.id;

    // Validate ticket types
    if (!req.body.ticketTypes || req.body.ticketTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one ticket type is required",
      });
    }

    // Validate dates
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (startDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Start date must be in the future",
      });
    }

    const event = await Event.create(req.body);
    await event.populate("organizer", "firstName lastName avatar");

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(400).json({
      success: false,
      message: "Error creating event",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Validate dates if being updated
    if (req.body.startDate || req.body.endDate) {
      const startDate = new Date(req.body.startDate || event.startDate);
      const endDate = new Date(req.body.endDate || event.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }
    }

    const oldEvent = { ...event.toObject() };
    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("organizer", "firstName lastName avatar");

    // Notify attendees if event details changed
    try {
      const bookings = await Booking.find({ 
        event: req.params.id, 
        status: "confirmed" 
      }).populate("user", "email");

      // Check if important details changed
      const importantChanges = [];
      if (req.body.startDate && oldEvent.startDate.toString() !== new Date(req.body.startDate).toString()) {
        importantChanges.push("Start date");
      }
      if (req.body.venue && JSON.stringify(oldEvent.venue) !== JSON.stringify(req.body.venue)) {
        importantChanges.push("Venue");
      }

      // Future: Send email notifications to attendees about important changes
    } catch (error) {
      console.error("Error checking event bookings:", error);
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(400).json({
      success: false,
      message: "Error updating event",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    // Check if event has bookings
    const bookingCount = await Booking.countDocuments({
      event: req.params.id,
      status: "confirmed",
    });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete event with confirmed bookings",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting event",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get events by organizer
const getOrganizerEvents = async (req, res) => {
  try {
    // Ensure events that have ended are marked as completed for organizers
    await Event.updateMany(
      { endDate: { $lte: new Date() }, status: 'published' },
      { $set: { status: 'completed' } }
    );
    const { page = 1, limit = 10, status } = req.query;

    const query = { organizer: req.user.id };
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Event.countDocuments(query);

    // Add analytics data safely
    const eventsWithAnalytics = events.map((event) => {
      const types = Array.isArray(event.ticketTypes) ? event.ticketTypes : [];
      const totalTicketsSold = types.reduce((sum, ticket) => sum + (Number(ticket?.sold) || 0), 0);
      const totalRevenue = types.reduce((sum, ticket) => sum + (Number(ticket?.price) || 0) * (Number(ticket?.sold) || 0), 0);
      const availableTickets = types.reduce((sum, ticket) => sum + Math.max(0, (Number(ticket?.quantity) || 0) - (Number(ticket?.sold) || 0)), 0);
      return {
        ...event,
        totalTicketsSold,
        totalRevenue,
        availableTickets,
      };
    });

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      events: eventsWithAnalytics,
    });
  } catch (error) {
    console.error("Get organizer events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting organizer events",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get event categories
const getCategories = async (req, res) => {
  try {
    const categories = [
      { value: "conference", label: "Conference", icon: "🎤" },
      { value: "workshop", label: "Workshop", icon: "🛠️" },
      { value: "seminar", label: "Seminar", icon: "📚" },
      { value: "networking", label: "Networking", icon: "🤝" },
      { value: "concert", label: "Concert", icon: "🎵" },
      { value: "festival", label: "Festival", icon: "🎪" },
      { value: "sports", label: "Sports", icon: "⚽" },
      { value: "exhibition", label: "Exhibition", icon: "🖼️" },
      { value: "webinar", label: "Webinar", icon: "💻" },
      { value: "meetup", label: "Meetup", icon: "👥" },
      { value: "other", label: "Other", icon: "📅" },
    ];

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting categories",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Search events
const searchEvents = async (req, res) => {
  try {
    const { q, location, category, date, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const query = {
      status: "published",
      $text: { $search: q },
    };

    // Add filters
    if (location) {
      query["venue.address.city"] = { $regex: location, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.startDate = {
        $gte: searchDate,
        $lt: nextDay,
      };
    }

    const events = await Event.find(query, { score: { $meta: "textScore" } })
      .populate("organizer", "firstName lastName avatar")
      .sort({ score: { $meta: "textScore" } })
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
    console.error("Search events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching events",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

// Get event analytics
const getEventAnalytics = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user is the organizer or admin
    if (
      event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view analytics for this event",
      });
    }

    // Get booking analytics
    const bookings = await Booking.find({
      event: req.params.id,
      status: "confirmed",
    });

    const analytics = {
      overview: {
        totalViews: event.analytics.views,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce(
          (sum, booking) => sum + booking.finalAmount,
          0
        ),
        totalTicketsSold: bookings.reduce(
          (sum, booking) => sum + booking.totalTickets,
          0
        ),
      },
      ticketSales: event.ticketTypes.map((ticket) => ({
        name: ticket.name,
        sold: ticket.sold,
        revenue: ticket.sold * ticket.price,
        remaining: ticket.quantity - ticket.sold,
      })),
      salesOverTime: [], // Would implement with daily/weekly aggregation
      demographics: {}, // Would implement with user data analysis
    };

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get event analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting event analytics",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getCategories,
  searchEvents,
  getEventAnalytics,
};