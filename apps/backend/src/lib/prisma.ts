import { PrismaClient } from "@prisma/client";

/**
 * Global singleton instance of PrismaClient
 * Prevents multiple instances in development due to hot reloading
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Prisma database client instance
 * Configured with environment-specific logging:
 * - Development: Logs queries, errors, and warnings for debugging
 * - Production: Only logs errors to reduce overhead
 * 
 * Uses singleton pattern to prevent multiple database connections
 * in development environment (Next.js hot reload creates new instances)
 * 
 * @example
 * import { prisma } from '../lib/prisma';
 * 
 * // Query database
 * const users = await prisma.user.findMany();
 * 
 * // Create record
 * const note = await prisma.note.create({
 *   data: { title: 'New Note', content: 'Content', userId: 'user123' }
 * });
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
