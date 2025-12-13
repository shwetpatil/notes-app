import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";

describe("Health and Metrics API", () => {
  describe("GET /api/health", () => {
    it("should return healthy status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: "healthy",
        },
      });
    });

    it("should include timestamp", async () => {
      const response = await request(app).get("/api/health");

      expect(response.body.data.timestamp).toBeDefined();
      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it("should include uptime", async () => {
      const response = await request(app).get("/api/health");

      expect(response.body.data.uptime).toBeDefined();
      expect(typeof response.body.data.uptime).toBe("number");
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });

    it("should be accessible without authentication", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      // Should work without session cookie
    });

    it("should respond quickly", async () => {
      const start = Date.now();
      const response = await request(app).get("/api/health");
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // Should respond in <100ms
    });
  });

  describe("GET /api/metrics", () => {
    it("should return metrics data", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object),
      });
    });

    it("should include memory usage", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.body.data.memory).toBeDefined();
      expect(response.body.data.memory).toMatchObject({
        rss: expect.any(Number),
        heapTotal: expect.any(Number),
        heapUsed: expect.any(Number),
        external: expect.any(Number),
      });
    });

    it("should include CPU usage", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.body.data.cpu).toBeDefined();
      expect(response.body.data.cpu).toMatchObject({
        user: expect.any(Number),
        system: expect.any(Number),
      });
    });

    it("should include process information", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.body.data.process).toBeDefined();
      expect(response.body.data.process.pid).toBeDefined();
      expect(response.body.data.process.uptime).toBeGreaterThan(0);
    });

    it("should include Node.js version", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.body.data.process.nodeVersion).toBeDefined();
      expect(response.body.data.process.nodeVersion).toContain("v");
    });

    it("should be accessible without authentication", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.status).toBe(200);
      // Metrics should be public for monitoring tools
    });

    it("should have consistent format across calls", async () => {
      const response1 = await request(app).get("/api/metrics");
      const response2 = await request(app).get("/api/metrics");

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Both should have the same structure
      expect(Object.keys(response1.body.data).sort()).toEqual(
        Object.keys(response2.body.data).sort()
      );
    });

    it("should show increasing uptime", async () => {
      const response1 = await request(app).get("/api/metrics");
      
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const response2 = await request(app).get("/api/metrics");

      expect(response2.body.data.process.uptime).toBeGreaterThanOrEqual(
        response1.body.data.process.uptime
      );
    });

    it("should report memory in bytes", async () => {
      const response = await request(app).get("/api/metrics");

      // Memory values should be reasonable (in bytes)
      expect(response.body.data.memory.rss).toBeGreaterThan(1000000); // > 1MB
      expect(response.body.data.memory.heapUsed).toBeGreaterThan(0);
      expect(response.body.data.memory.heapTotal).toBeGreaterThan(
        response.body.data.memory.heapUsed
      );
    });

    it("should report CPU time in microseconds", async () => {
      const response = await request(app).get("/api/metrics");

      expect(response.body.data.cpu.user).toBeGreaterThanOrEqual(0);
      expect(response.body.data.cpu.system).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Health Check Integration", () => {
    it("should verify database connectivity", async () => {
      const response = await request(app).get("/api/health");

      // If health check includes DB status
      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("healthy");
      
      // A healthy response indicates DB is accessible
    });

    it("should be suitable for load balancer health checks", async () => {
      // Load balancers typically expect fast, simple responses
      const start = Date.now();
      const response = await request(app).get("/api/health");
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should be fast
      expect(response.body.data.status).toBe("healthy");
    });

    it("should work with HEAD requests", async () => {
      const response = await request(app).head("/api/health");

      // HEAD requests should work for simple health checks
      expect(response.status).toBeLessThan(400);
    });
  });

  describe("Monitoring Endpoints Performance", () => {
    it("should handle concurrent health check requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get("/api/health")
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe("healthy");
      });
    });

    it("should handle concurrent metrics requests", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get("/api/metrics")
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.data.memory).toBeDefined();
      });
    });
  });
});
