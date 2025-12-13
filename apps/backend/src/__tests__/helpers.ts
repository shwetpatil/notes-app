import request from "supertest";
import { app } from "../server";
import { prisma } from "../config";
import bcrypt from "bcrypt";

/**
 * Test user data
 */
export const testUsers = {
  alice: {
    email: "alice@test.com",
    password: "password123",
    name: "Alice",
  },
  bob: {
    email: "bob@test.com",
    password: "password456",
    name: "Bob",
  },
};

/**
 * Test note data
 */
export const testNotes = {
  personal: {
    title: "Personal Note",
    content: "This is a personal note",
    tags: ["personal"],
  },
  work: {
    title: "Work Note",
    content: "This is a work note",
    tags: ["work"],
    isPinned: true,
  },
  archived: {
    title: "Archived Note",
    content: "This is an archived note",
    tags: ["archive"],
    isArchived: true,
  },
};

/**
 * Create a user directly in database
 */
export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
}) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return await prisma.user.create({
    data: {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    },
  });
}

/**
 * Create a note directly in database
 */
export async function createNote(userId: string, noteData: any) {
  return await prisma.note.create({
    data: {
      ...noteData,
      userId,
    },
  });
}

/**
 * Register a user via API and return session cookie
 */
export async function registerUser(userData: {
  email: string;
  password: string;
}): Promise<{ response: request.Response; cookie: string[] }> {
  const response = await request(app).post("/api/auth/register").send(userData);

  const cookie = response.headers["set-cookie"] as unknown as string[];
  return { response, cookie };
}

/**
 * Login a user via API and return session cookie
 */
export async function loginUser(userData: { email: string; password: string }): Promise<{ response: request.Response; cookie: string[] }> {
  const response = await request(app).post("/api/auth/login").send(userData);

  const cookie = response.headers["set-cookie"] as unknown as string[];
  return { response, cookie };
}

/**
 * Create authenticated request with session cookie
 */
export function authenticatedRequest(cookie: string[]) {
  return request(app).set("Cookie", cookie);
}

/**
 * Extract user ID from response
 */
export function extractUserId(response: request.Response): string {
  return response.body.data.user.id;
}

/**
 * Wait for specified milliseconds (useful for rate limit tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random email for testing
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}
