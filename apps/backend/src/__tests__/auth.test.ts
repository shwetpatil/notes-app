import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server";
import {
  testUsers,
  createUser,
  registerUser,
  loginUser,
  wait,
  randomEmail,
} from "./helpers";
import { prisma } from "../lib/prisma";

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user with valid credentials", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUsers.alice.email,
        name: "alice",
      });
      expect(response.body.data.user.id).toBeDefined();
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should not return password in response", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password,
      });

      expect(response.body.data.user.password).toBeUndefined();
    });

    it("should reject registration with existing email", async () => {
      // First registration
      await registerUser(testUsers.alice);

      // Attempt duplicate registration
      const response = await request(app).post("/api/auth/register").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Registration failed");
    });

    it("should reject registration with invalid email format", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: testUsers.alice.password,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid email format");
    });

    it("should reject registration with short password", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: testUsers.alice.email,
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("at least 8 characters");
    });

    it("should reject registration with missing email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        password: testUsers.alice.password,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should reject registration with missing password", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: testUsers.alice.email,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should hash password before storing", async () => {
      await registerUser(testUsers.alice);

      const user = await prisma.user.findUnique({
        where: { email: testUsers.alice.email },
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(testUsers.alice.password);
      expect(user?.password).toContain("$2b$"); // bcrypt hash prefix
    });

    it("should enforce rate limiting on auth endpoints", async () => {
      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/register")
          .send({
            email: randomEmail(),
            password: "password123",
          });
      }

      // 6th request should be rate limited
      const response = await request(app).post("/api/auth/register").send({
        email: randomEmail(),
        password: "password123",
      });

      expect(response.status).toBe(429);
      expect(response.body.message).toContain("Too many");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      // Register first
      await registerUser(testUsers.alice);

      // Login
      const response = await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUsers.alice.email,
      });
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should reject login with non-existent email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@test.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should reject login with wrong password", async () => {
      await registerUser(testUsers.alice);

      const response = await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should increment failed login attempts on wrong password", async () => {
      await registerUser(testUsers.alice);

      // First failed attempt
      await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: "wrongpassword",
      });

      const user = await prisma.user.findUnique({
        where: { email: testUsers.alice.email },
      });

      expect(user?.failedLoginAttempts).toBe(1);
    });

    it("should lock account after max failed attempts", async () => {
      await registerUser(testUsers.alice);

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/auth/login").send({
          email: testUsers.alice.email,
          password: "wrongpassword",
        });
      }

      // Check that account is locked
      const response = await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password, // Even with correct password
      });

      expect(response.status).toBe(423); // Locked
      expect(response.body.error).toContain("Account locked");
    });

    it("should reset failed attempts after successful login", async () => {
      await registerUser(testUsers.alice);

      // Failed attempt
      await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: "wrongpassword",
      });

      // Successful login
      await request(app).post("/api/auth/login").send({
        email: testUsers.alice.email,
        password: testUsers.alice.password,
      });

      const user = await prisma.user.findUnique({
        where: { email: testUsers.alice.email },
      });

      expect(user?.failedLoginAttempts).toBe(0);
      expect(user?.accountLockedUntil).toBeNull();
    });

    it("should update lastLoginAt timestamp", async () => {
      await registerUser(testUsers.alice);

      const beforeLogin = await prisma.user.findUnique({
        where: { email: testUsers.alice.email },
      });

      await wait(100); // Small delay to ensure timestamp difference

      await loginUser(testUsers.alice);

      const afterLogin = await prisma.user.findUnique({
        where: { email: testUsers.alice.email },
      });

      expect(afterLogin?.lastLoginAt).toBeDefined();
      expect(afterLogin?.lastLoginAt?.getTime()).toBeGreaterThan(
        beforeLogin?.lastLoginAt?.getTime() || 0
      );
    });

    it("should reject login with invalid email format", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout authenticated user", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should clear session cookie on logout", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", cookie);

      const setCookie = response.headers["set-cookie"];
      expect(setCookie).toBeDefined();
      // Cookie should be expired or cleared
      expect(setCookie[0]).toContain("Expires=");
    });

    it("should reject logout without authentication", async () => {
      const response = await request(app).post("/api/auth/logout");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should not allow access after logout", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      // Logout
      await request(app).post("/api/auth/logout").set("Cookie", cookie);

      // Try to access protected route with old cookie
      const response = await request(app)
        .get("/api/notes")
        .set("Cookie", cookie);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user info when authenticated", async () => {
      const { cookie, response: registerResponse } = await registerUser(
        testUsers.alice
      );

      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUsers.alice.email,
      });
    });

    it("should reject unauthenticated requests", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should not expose sensitive data", async () => {
      const { cookie } = await registerUser(testUsers.alice);

      const response = await request(app)
        .get("/api/auth/me")
        .set("Cookie", cookie);

      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.failedLoginAttempts).toBeUndefined();
      expect(response.body.data.user.accountLockedUntil).toBeUndefined();
    });
  });
});
