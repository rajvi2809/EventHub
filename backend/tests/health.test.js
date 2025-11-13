const request = require("supertest");
const app = require("../server");

describe("Health Check", () => {
  it("should return API running message", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
  });
});
