import { z } from "zod";

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Note Types
// ============================================================================

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isMarkdown: boolean;
  isTrashed: boolean;
  trashedAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string(),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
  isFavorite: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
  isMarkdown: z.boolean().optional().default(false),
  isTrashed: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isMarkdown: z.boolean().optional(),
  isTrashed: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: SessionUser;
  message: string;
}
