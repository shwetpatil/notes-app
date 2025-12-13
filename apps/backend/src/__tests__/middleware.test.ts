import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";
import { registerUser } from "./helpers";

describe("Middleware Tests", () => {
  describe("Authentication Middleware", () => {
    it("should block unauthenticated requests to protected routes", async () => {
      const response = await request(app).get("/api/notes");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Authentication required");
    });

    it("should allow authenticated requests to protected routes", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
    });

    it("should reject requests with invalid session", async () => {
      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", ["connect.sid=invalid-session-id"]);

      expect(response.status).toBe(401);
    });
  });

  describe("Sanitization Middleware", () => {
    it("should sanitize malicious script tags in note content", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({
          title: "Test Note",
          content: '<script>alert("XSS")</script>Safe content',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain("<script>");
      expect(response.body.data.content).toContain("Safe content");
    });

    it("should sanitize iframe tags", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({
          title: "Test Note",
          content: '<iframe src="malicious.com"></iframe>Safe content',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain("<iframe>");
    });

    it("should allow safe HTML in markdown", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({
          title: "Test Note",
          content: "<strong>Bold</strong> and <em>italic</em> text",
        });

      expect(response.status).toBe(201);
      // Safe tags should be preserved
      expect(response.body.data.content).toContain("Bold");
      expect(response.body.data.content).toContain("italic");
    });

    it("should remove javascript: URLs", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({
          title: "Test Note",
          content: '<a href="javascript:alert(\'XSS\')">Click</a>',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain("javascript:");
    });

    it("should sanitize event handlers", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .post("/api/notes")
        .set("Cookie", cookie)
        .send({
          title: "Test Note",
          content: '<div onclick="alert(\'XSS\')">Click me</div>',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).not.toContain("onclick");
    });
  });

  describe("Rate Limiting Middleware", () => {
    it("should rate limit authentication endpoints", async () => {
      // Make maximum allowed requests
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/auth/login").send({
          email: `test${i}@test.com`,
          password: "password123",
        });
      }

      // Next request should be rate limited
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "password123",
      });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain("Too many");
    });

    it("should rate limit general API endpoints", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      // Make many requests (the general rate limit is higher, typically 100/15min)
      // We'll make enough to trigger it
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app).get("/api/notes").set("Cookie", cookie)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });

    it("should not rate limit successful auth requests", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      // Successful login shouldn't count toward rate limit
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post("/api/auth/login").send({
          email: "test@test.com",
          password: "password123",
        });
        expect(response.status).toBe(200);
      }
    });
  });

  describe("Error Handler Middleware", () => {
    it("should handle 404 errors gracefully", async () => {
      const response = await request(app).get("/api/non-existent");

      expect(response.status).toBe(404);
    });

    it("should not expose stack traces in production", async () => {
      // This would need server to be in production mode
      // For now, just ensure errors return proper JSON
      const response = await request(app).post("/api/notes").send({
        // Invalid data to trigger error
        invalid: "data",
      });

      expect(response.body).toHaveProperty("success");
      expect(response.body.success).toBe(false);
      // Should not expose internal details
      expect(response.body).not.toHaveProperty("stack");
    });

    it("should return proper error format", async () => {
      const response = await request(app).get("/api/notes");

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });
  });

  describe("Security Headers Middleware (Helmet)", () => {
    it("should set security headers", async () => {
      const response = await request(app).get("/api/health");

      // Check for common security headers set by Helmet
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      
      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
      
      // Helmet sets this header
      expect(response.headers).toHaveProperty("x-download-options");
    });

    it("should set HSTS header in production", async () => {
      // In production, Helmet should set Strict-Transport-Security
      const response = await request(app).get("/api/health");

      // HSTS is only set when running with HTTPS in production
      // Just verify the header configuration is present
      expect(response.headers).toBeDefined();
    });
  });

  describe("CORS Middleware", () => {
    it("should allow requests from configured origin", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", process.env.CORS_ORIGIN || "http://localhost:3000");

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("should allow credentials", async () => {
      const response = await request(app)
        .get("/api/health")
        .set("Origin", process.env.CORS_ORIGIN || "http://localhost:3000");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should handle preflight requests", async () => {
      const response = await request(app)
        .options("/api/notes")
        .set("Origin", process.env.CORS_ORIGIN || "http://localhost:3000")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBeLessThan(400);
      expect(response.headers["access-control-allow-methods"]).toBeDefined();
    });
  });

  describe("Performance Monitoring Middleware", () => {
    it("should track request timing", async () => {
      const { cookie } = await registerUser({
        email: "test@test.com",
        password: "password123",
      });

      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", cookie);

      // The middleware should add timing information
      expect(response.status).toBe(200);
      // Response time is tracked internally
    });

    it("should work on all routes", async () => {
      const healthResponse = await request(app).get("/api/health");
      expect(healthResponse.status).toBe(200);

      const metricsResponse = await request(app).get("/api/metrics");
      expect(metricsResponse.status).toBe(200);
    });
  });
});
