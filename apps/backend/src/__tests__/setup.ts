import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../config";

// Setup before all tests
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes("test")) {
    throw new Error("Tests must use a test database! Set DATABASE_URL to include 'test'");
  }
});

// Clean up database before each test
beforeEach(async () => {
  // Delete all records in order (respect foreign key constraints)
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
