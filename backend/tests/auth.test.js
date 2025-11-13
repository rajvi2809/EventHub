const request = require("supertest");
const app = require("../server");

describe("Auth API Tests", () => {
  test("POST /api/auth/register should return user object", async () => {
    const user = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };
    const res = await request(app).post("/api/auth/register").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("email", "test@example.com");
  });

  test("POST /api/auth/login should return token", async () => {
    const credentials = {
      email: "test@example.com",
      password: "password123",
    };
    const res = await request(app).post("/api/auth/login").send(credentials);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});
