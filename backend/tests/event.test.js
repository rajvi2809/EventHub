const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: "eventhub_test" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Event API Tests", () => {
  test("GET /api/events should return an array", async () => {
    const res = await request(app).get("/api/events");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/events should create an event", async () => {
    const event = {
      title: "Jest Test Event",
      date: "2025-11-06",
      location: "Virtual",
    };
    const res = await request(app).post("/api/events").send(event);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("title", "Jest Test Event");
  });
});
