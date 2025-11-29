const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
require('dotenv').config();

const app = express();
app.use(express.json());

const bookingRouter = require('../routes/bookings');
app.use('/api/bookings', bookingRouter);

const { seedTestData, clearDatabase } = require('./seedData');

describe('Booking Controller Tests', () => {
  let testData;
  let organizerToken;
  let attendeeToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventhub-test';
      await mongoose.connect(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      try {
        await mongoose.connection.dropDatabase();
      } catch (err) {
        console.log('Could not drop database:', err.message);
      }
    }
  });

  afterAll(async () => {
    await clearDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await clearDatabase();
    testData = await seedTestData();

    organizerToken = jwt.sign(
      { id: testData.users[0]._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    attendeeToken = jwt.sign(
      { id: testData.users[1]._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/bookings', () => {
    test('Should create booking with valid data', async () => {
      const eventId = testData.events[0]._id;
      const ticketTypeId = testData.events[0].ticketTypes[0]._id;

      const bookingData = {
        eventId,
        items: [
          {
            ticketTypeId,
            quantity: 1,
          },
        ],
        attendees: [
          {
            firstName: 'Test',
            lastName: 'Attendee',
            email: 'test.attendee@example.com',
          },
        ],
        billingAddress: {
          firstName: 'Test',
          lastName: 'Attendee',
          email: 'test.attendee@example.com',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'India',
          zipCode: '123456',
        },
        paymentMethod: 'razorpay',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.booking._id).toBeDefined();
      expect(response.body.booking.bookingNumber).toBeDefined();
      expect(response.body.booking.status).toBe('confirmed');
      expect(response.body.booking.totalTickets).toBe(1);
    });

    test('Should reject booking without authentication', async () => {
      const eventId = testData.events[0]._id;
      const ticketTypeId = testData.events[0].ticketTypes[0]._id;

      const response = await request(app)
        .post('/api/bookings')
        .send({
          eventId,
          items: [{ ticketTypeId, quantity: 1 }],
          attendees: [{ firstName: 'Test', lastName: 'User', email: 'test@test.com' }],
          billingAddress: {},
          paymentMethod: 'razorpay',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should reject booking for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          eventId: fakeEventId,
          items: [{ ticketTypeId: new mongoose.Types.ObjectId(), quantity: 1 }],
          attendees: [{ firstName: 'Test', lastName: 'User', email: 'test@test.com' }],
          billingAddress: {},
          paymentMethod: 'razorpay',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Should reject booking when tickets not available', async () => {
      const eventId = testData.events[0]._id;
      const ticketTypeId = testData.events[0].ticketTypes[0]._id;

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          eventId,
          items: [
            {
              ticketTypeId,
              quantity: 1000,
            },
          ],
          attendees: [
            {
              firstName: 'Test',
              lastName: 'Attendee',
              email: 'test@example.com',
            },
          ],
          billingAddress: {},
          paymentMethod: 'razorpay',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not enough tickets');
    });

    test('Should reject booking exceeding max per order', async () => {
      const eventId = testData.events[0]._id;
      const ticketTypeId = testData.events[0].ticketTypes[0]._id;

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          eventId,
          items: [
            {
              ticketTypeId,
              quantity: 50,
            },
          ],
          attendees: Array(50).fill({
            firstName: 'Test',
            lastName: 'Attendee',
            email: 'test@example.com',
          }),
          billingAddress: {},
          paymentMethod: 'razorpay',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Maximum');
    });
  });

  describe('GET /api/bookings', () => {
    test('Should get user bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('Should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/bookings?status=confirmed')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should support pagination', async () => {
      const response = await request(app)
        .get('/api/bookings?page=1&limit=5')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/bookings/:id', () => {
    test('Should get single booking', async () => {
      const bookingId = testData.bookings[0]._id;
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking._id).toBe(bookingId.toString());
    });

    test('Should reject getting non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Should reject unauthorized access to booking', async () => {
      const bookingId = testData.bookings[0]._id;
      const newToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${newToken}`);

      // API currently may return 401 Unauthorized or 403 Forbidden for unauthorized access
      expect([401, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject request without authentication', async () => {
      const bookingId = testData.bookings[0]._id;
      const response = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    test('Should cancel booking with valid cancellation window', async () => {
      const bookingId = testData.bookings[0]._id;
      const response = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking.status).toBe('cancelled');
      expect(response.body.booking.refundDetails).toBeDefined();
    });

    test('Should reject cancellation of non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/bookings/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Should reject double cancellation', async () => {
      const bookingId = testData.bookings[0]._id;
      await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(200);

      const response = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already cancelled');
    });

    test('Should reject unauthorized cancellation', async () => {
      const bookingId = testData.bookings[0]._id;
      const newToken = jwt.sign(
        { id: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${newToken}`);

      // API may return 401 or 403 depending on whether token user is recognized
      expect([401, 403]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    test('Should reject request without authentication', async () => {
      const bookingId = testData.bookings[0]._id;
      const response = await request(app)
        .put(`/api/bookings/${bookingId}/cancel`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings/event/:eventId', () => {
    test('Should get event bookings as organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .get(`/api/bookings/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });

    test('Should reject event bookings for non-organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .get(`/api/bookings/event/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Should reject request without authentication', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .get(`/api/bookings/event/${eventId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
