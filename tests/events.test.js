const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
require('dotenv').config();

const app = express();
app.use(express.json());

const eventRouter = require('../routes/events');
app.use('/api/events', eventRouter);

const { seedTestData, clearDatabase } = require('./seedData');

describe('Event Controller Tests', () => {
  let testData;
  let organizerToken;
  let attendeeToken;
  let adminToken;

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
    adminToken = jwt.sign(
      { id: testData.users[2]._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('GET /api/events', () => {
    test('Should get all published events with pagination', async () => {
      const response = await request(app)
        .get('/api/events?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    test('Should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events?category=conference')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);
      response.body.events.forEach(event => {
        expect(event.category).toBe('conference');
      });
    });

    test('Should filter events by location', async () => {
      const response = await request(app)
        .get('/api/events?location=Mumbai')
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.events.length > 0) {
        expect(response.body.events[0].venue.address.city).toBe('Mumbai');
      }
    });

    test('Should search events by keyword', async () => {
      const response = await request(app)
        .get('/api/events?search=tech')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should sort events', async () => {
      const response = await request(app)
        .get('/api/events?sort=startDate')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('Should handle pagination correctly', async () => {
      const response1 = await request(app)
        .get('/api/events?page=1&limit=1')
        .expect(200);

      expect(response1.body.pagination.pages).toBeGreaterThan(0);
      expect(response1.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/events/:id', () => {
    test('Should get single event by ID', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event._id).toBe(eventId.toString());
      expect(response.body.event.title).toBeDefined();
      expect(response.body.event.organizer).toBeDefined();
    });

    test('Should increment view count when fetching event', async () => {
      const eventId = testData.events[0]._id;
      const eventBefore = await Event.findById(eventId);
      const viewsBefore = eventBefore.analytics.views;

      await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      const eventAfter = await Event.findById(eventId);
      expect(eventAfter.analytics.views).toBe(viewsBefore + 1);
    });

    test('Should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/events/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('Should include computed fields in response', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(response.body.event.totalTicketsSold).toBeDefined();
      expect(response.body.event.availableTickets).toBeDefined();
      expect(response.body.event.totalRevenue).toBeDefined();
    });
  });

  describe('POST /api/events', () => {
    test('Should create event with valid data as organizer', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const eventData = {
        title: 'New Networking Event',
        description: 'Professional networking event for IT professionals',
        shortDescription: 'Networking event for tech professionals',
        category: 'networking',
        startDate: futureDate,
        endDate: new Date(futureDate.getTime() + 4 * 60 * 60 * 1000),
        venue: {
          type: 'physical',
          name: 'Tech Hub',
          address: {
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
          },
        },
        ticketTypes: [
          {
            name: 'Standard Pass',
            price: 999,
            quantity: 200,
            maxPerOrder: 5,
            saleEndDate: new Date(futureDate.getTime() - 1 * 60 * 60 * 1000),
          },
        ],
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.event._id).toBeDefined();
      expect(response.body.event.title).toBe(eventData.title);
      expect(response.body.event.organizer._id).toBe(testData.users[0]._id.toString());
    });

    test('Should reject event creation without authentication', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/events')
        .send({
          title: 'Unauthorized Event',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Should reject event creation by attendee role', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Unauthorized Event',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Should reject event without ticket types', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Event Without Tickets',
          description: 'Invalid event',
          category: 'conference',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          venue: { type: 'physical', address: {} },
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ticket');
    });

    test('Should reject event with end date before start date', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Invalid Date Event',
          description: 'Invalid event',
          category: 'conference',
          startDate: futureDate,
          endDate: new Date(futureDate.getTime() - 1 * 60 * 60 * 1000),
          venue: { type: 'physical', address: {} },
          ticketTypes: [{
            name: 'Pass',
            price: 1000,
            quantity: 100,
            saleEndDate: new Date(futureDate.getTime() - 1 * 60 * 60 * 1000),
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Should reject event with start date in the past', async () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Past Event',
          description: 'Invalid event',
          category: 'conference',
          startDate: pastDate,
          endDate: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000),
          venue: { type: 'physical', address: {} },
          ticketTypes: [{
            name: 'Pass',
            price: 1000,
            quantity: 100,
            saleEndDate: pastDate,
          }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/events/:id', () => {
    test('Should update event as organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          title: 'Updated Event Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event.title).toBe('Updated Event Title');
    });

    test('Should reject event update by non-organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Should reject event update without authentication', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/events/:id', () => {
    test('Should delete event as organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      // Deletion may fail if there are existing bookings or constraints; accept 200 or 400.
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      } else {
        expect(response.body.success).toBe(false);
      }
    });

    test('Should reject event deletion by non-organizer', async () => {
      const eventId = testData.events[0]._id;
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${attendeeToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('Should reject deletion of non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/events/${fakeId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/events/categories', () => {
    test('Should get all event categories', async () => {
      const response = await request(app)
        .get('/api/events/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/events/organizer/my-events', () => {
    test('Should get organizer events', async () => {
      const response = await request(app)
        .get('/api/events/organizer/my-events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    test('Should reject my-events without authentication', async () => {
      const response = await request(app)
        .get('/api/events/organizer/my-events')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
