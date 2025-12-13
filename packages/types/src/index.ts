import { z } from "zod";

// ============================================================================
// Monitoring Types
// ============================================================================

export * from "./monitoring";

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
  contentFormat?: "plaintext" | "markdown" | "html";
  tags: string[];
  color?: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isMarkdown: boolean; // Deprecated: use contentFormat instead
  isTrashed: boolean;
  trashedAt?: Date;
  folderId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
}

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional().default("plaintext"),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional(),
  folderId: z.string().optional(),
  isPinned: z.boolean().optional().default(false),
  isFavorite: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false),
  isMarkdown: z.boolean().optional().default(false), // Deprecated
  isTrashed: z.boolean().optional().default(false),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  content: z.string().optional(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
  folderId: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isMarkdown: z.boolean().optional(), // Deprecated
  isTrashed: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

// ============================================================================
// Template Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description?: string;
  content: string;
  contentFormat: "plaintext" | "markdown" | "html";
  tags: string[];
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  content: z.string(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional().default("plaintext"),
  tags: z.array(z.string()).optional().default([]),
  color: z.string().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  content: z.string().optional(),
  contentFormat: z.enum(["plaintext", "markdown", "html"]).optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

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

// ============================================================================
// Folder Types
// ============================================================================

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

// ============================================================================
// Note Sharing Types
// ============================================================================

export interface NoteShare {
  id: string;
  noteId: string;
  sharedWith: string; // Email or userId
  permission: "view" | "edit";
  sharedBy: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const createShareSchema = z.object({
  noteId: z.string(),
  sharedWith: z.string().email("Must be a valid email"),
  permission: z.enum(["view", "edit"]),
  expiresAt: z.string().datetime().optional(),
});

export const updateShareSchema = z.object({
  permission: z.enum(["view", "edit"]).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;

// ============================================================================
// Note Version Types
// ============================================================================

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  contentFormat: "plaintext" | "markdown" | "html";
  tags: string[];
  version: number;
  createdBy: string;
  createdAt: Date;
}

export interface NoteWithVersions extends Note {
  versions?: NoteVersion[];
  currentVersion?: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = "pdf" | "markdown" | "json" | "html";

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTags?: boolean;
}
