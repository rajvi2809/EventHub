const request = require("supertest");
const app = require("../server");

describe("Booking API Tests", () => {
  test("GET /api/bookings should return all bookings", async () => {
    const res = await request(app).get("/api/bookings");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
