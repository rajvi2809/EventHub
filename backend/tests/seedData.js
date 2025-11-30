const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const PaymentOrder = require('../models/PaymentOrder');
const { generateTicketCode, generateBookingNumber } = require('../utils/generateTicketCode');

const seedTestData = async () => {
  try {
    const mongoose = require('mongoose');
    
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      PaymentOrder.deleteMany({}),
    ]);

    const users = await User.create([
      {
        firstName: 'John',
        lastName: 'Organizer',
        email: 'organizer@test.com',
        password: 'password123',
        role: 'organizer',
        phone: '9876543210',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        bio: 'Professional event organizer',
        location: 'Mumbai, India',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Jane',
        lastName: 'Attendee',
        email: 'attendee@test.com',
        password: 'password123',
        role: 'attendee',
        phone: '9876543211',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        bio: 'Event enthusiast',
        location: 'Delhi, India',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        phone: '9876543212',
        isVerified: true,
        isActive: true,
      },
      {
        firstName: 'Unverified',
        lastName: 'User',
        email: 'unverified@test.com',
        password: 'password123',
        role: 'attendee',
        isVerified: false,
        isActive: true,
      },
    ]);

    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events = await Event.create([
      {
        title: 'Tech Conference 2024',
        description: 'Annual conference featuring the latest in technology and innovation',
        shortDescription: 'Annual tech conference with industry leaders',
        category: 'conference',
        organizer: users[0]._id,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        timezone: 'Asia/Kolkata',
        venue: {
          type: 'physical',
          name: 'Taj Hotel Convention Center',
          address: {
            street: '123 Tech Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            zipCode: '400001',
          },
          coordinates: {
            latitude: 19.0825,
            longitude: 72.8730,
          },
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1540575467063-178f50002c4b',
            alt: 'Tech Conference Banner',
            isPrimary: true,
          },
        ],
        ticketTypes: [
          {
            name: 'Basic Pass',
            description: 'Single day access',
            price: 2999,
            quantity: 100,
            sold: 25,
            maxPerOrder: 10,
            saleEndDate: new Date(futureDate.getTime() - 12 * 60 * 60 * 1000),
          },
          {
            name: 'Premium Pass',
            description: 'Full conference + networking dinner',
            price: 5999,
            quantity: 50,
            sold: 10,
            maxPerOrder: 5,
            saleEndDate: new Date(futureDate.getTime() - 12 * 60 * 60 * 1000),
          },
        ],
        capacity: 200,
        status: 'published',
        isPublic: true,
        refundPolicy: '100% refund if cancelled 7 days before event',
        tags: ['technology', 'innovation', 'networking'],
        analytics: {
          views: 450,
          uniqueViews: 320,
          shares: 28,
        },
      },
      {
        title: 'Web Development Workshop',
        description: 'Learn modern web development with React and Node.js',
        shortDescription: 'Hands-on workshop for web developers',
        category: 'workshop',
        organizer: users[0]._id,
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 8 * 60 * 60 * 1000),
        venue: {
          type: 'online',
          onlineDetails: {
            platform: 'Zoom',
            link: 'https://zoom.us/meeting/123456',
            accessInstructions: 'Link will be sent 24 hours before the workshop',
          },
        },
        images: [
          {
            url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
            alt: 'Workshop Banner',
            isPrimary: true,
          },
        ],
        ticketTypes: [
          {
            name: 'Workshop Access',
            description: 'Full access to workshop + materials',
            price: 1999,
            quantity: 300,
            sold: 75,
            maxPerOrder: 20,
            saleEndDate: new Date(futureDate.getTime() - 6 * 60 * 60 * 1000),
          },
        ],
        capacity: 500,
        status: 'published',
        isPublic: true,
        tags: ['web development', 'coding', 'online'],
      },
      {
        title: 'Past Music Festival',
        description: 'Three-day music festival with international artists',
        category: 'festival',
        organizer: users[0]._id,
        startDate: pastDate,
        endDate: new Date(pastDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        venue: {
          type: 'physical',
          name: 'Music Park',
          address: {
            street: '456 Music Avenue',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            zipCode: '560001',
          },
        },
        ticketTypes: [
          {
            name: '3-Day Pass',
            price: 4999,
            quantity: 1000,
            sold: 800,
            maxPerOrder: 10,
            saleEndDate: pastDate,
          },
        ],
        status: 'completed',
        isPublic: true,
      },
    ]);

    const bookings = await Booking.create([
      {
        bookingNumber: generateBookingNumber(),
        user: users[1]._id,
        event: events[0]._id,
        items: [
          {
            ticketType: events[0].ticketTypes[0]._id,
            ticketTypeName: 'Basic Pass',
            price: 2999,
            quantity: 2,
            subtotal: 5998,
          },
        ],
        attendees: [
          {
            firstName: 'Jane',
            lastName: 'Attendee',
            email: 'jane1@test.com',
            ticketCode: generateTicketCode(),
            checkedIn: false,
          },
          {
            firstName: 'John',
            lastName: 'Guest',
            email: 'john.guest@test.com',
            ticketCode: generateTicketCode(),
            checkedIn: false,
          },
        ],
        totalAmount: 5998,
        platformFee: 179.94,
        processingFee: 2.5,
        finalAmount: 6180.44,
        paymentMethod: 'razorpay',
        billingAddress: {
          firstName: 'Jane',
          lastName: 'Attendee',
          email: 'attendee@test.com',
          phone: '9876543211',
          address: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          zipCode: '110001',
        },
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentDetails: {
          transactionId: 'txn_' + Date.now(),
          paymentGateway: 'razorpay',
          paymentDate: new Date(),
        },
      },
      {
        bookingNumber: generateBookingNumber(),
        user: users[1]._id,
        event: events[1]._id,
        items: [
          {
            ticketType: events[1].ticketTypes[0]._id,
            ticketTypeName: 'Workshop Access',
            price: 1999,
            quantity: 1,
            subtotal: 1999,
          },
        ],
        attendees: [
          {
            firstName: 'Jane',
            lastName: 'Attendee',
            email: 'attendee@test.com',
            ticketCode: generateTicketCode(),
            checkedIn: false,
          },
        ],
        totalAmount: 1999,
        platformFee: 59.97,
        processingFee: 2.5,
        finalAmount: 2061.47,
        paymentMethod: 'razorpay',
        billingAddress: {
          firstName: 'Jane',
          lastName: 'Attendee',
          email: 'attendee@test.com',
          address: '123 Main Street',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
        },
        status: 'confirmed',
        paymentStatus: 'completed',
      },
    ]);

    const reviews = await Review.create([
      {
        user: users[1]._id,
        event: events[2]._id,
        booking: bookings[0]._id,
        rating: 5,
        title: 'Amazing event!',
        comment: 'The festival was well-organized and the artists were fantastic. Highly recommended!',
        aspects: {
          organization: 5,
          venue: 4,
          content: 5,
          value: 4,
        },
        isVerified: true,
        isPublic: true,
        helpfulVotes: 12,
        moderationStatus: 'approved',
      },
    ]);

    const paymentOrders = await PaymentOrder.create([
      {
        userId: users[1]._id,
        eventId: events[0]._id,
        bookingId: bookings[0]._id,
        amount: 6180.44,
        userEmail: 'attendee@test.com',
        userPhone: '9876543211',
        razorpayOrderId: 'order_' + Date.now(),
        razorpayPaymentId: 'pay_' + Date.now(),
        paymentStatus: 'Paid',
      },
    ]);

    return {
      users,
      events,
      bookings,
      reviews,
      paymentOrders,
    };
  } catch (error) {
    console.error('Seed data error:', error);
    throw error;
  }
};

const clearDatabase = async () => {
  try {
    const mongoose = require('mongoose');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await PaymentOrder.deleteMany({});
  } catch (error) {
    console.log('Clear database error:', error.message);
  }
};

module.exports = { seedTestData, clearDatabase };
