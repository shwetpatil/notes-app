/**
 * Notes Service
 * Business logic for note operations
 * Separates route handlers from database operations
 */

import { prisma } from "../config";
import { logger } from "../config";
import { Prisma } from "@prisma/client";
import { 
  SEARCH_CONSTANTS, 
  DB_CONSTANTS, 
  ERROR_MESSAGES,
  LOG_EVENTS 
} from "../constants";

// ============================================================================
// Types
// ============================================================================

export interface NoteFilters {
  search?: string;
  tags?: string[];
  archived?: boolean;
  trashed?: boolean;
  folderId?: string | null;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface NotePagination {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateNoteData {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
  folderId?: string | null;
  isArchived?: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  tags?: string[];
  color?: string;
  folderId?: string | null;
  isArchived?: boolean;
  isPinned?: boolean;
  isFavorite?: boolean;
  isTrashed?: boolean;
}

// ============================================================================
// Note Service Class
// ============================================================================

export class NoteService {
  /**
   * Get all notes for a user with filters and pagination
   */
  static async getNotes(
    userId: string,
    filters: NoteFilters = {},
    pagination: NotePagination = {}
  ) {
    try {
      const where: Prisma.NoteWhereInput = { userId };

      // Filter by trash status
      if (filters.trashed !== undefined) {
        where.isTrashed = filters.trashed;
      } else {
        where.isTrashed = false;
      }

      // Filter by archived status (only for non-trashed)
      if (!filters.trashed && filters.archived !== undefined) {
        where.isArchived = filters.archived;
      }

      // Filter by folder
      if (filters.folderId !== undefined) {
        where.folderId = filters.folderId;
      }

      // Filter by pinned/favorite
      if (filters.isPinned !== undefined) {
        where.isPinned = filters.isPinned;
      }
      if (filters.isFavorite !== undefined) {
        where.isFavorite = filters.isFavorite;
      }

      // Search in title and content
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { content: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      // Build orderBy
      const orderBy: Prisma.NoteOrderByWithRelationInput[] = [];
      
      // Favorites and pinned always on top
      if (!filters.trashed) {
        orderBy.push({ isFavorite: "desc" });
        orderBy.push({ isPinned: "desc" });
      }
      
      // Then sort by user preference
      const sortBy = pagination.sortBy || "updatedAt";
      const order = pagination.order || "desc";
      
      if (SEARCH_CONSTANTS.VALID_SORT_FIELDS.includes(sortBy as any)) {
        orderBy.push({ [sortBy]: order });
      } else {
        orderBy.push({ updatedAt: "desc" });
      }

      // Pagination
      const page = pagination.page || 1;
      const pageSize = Math.min(
        pagination.pageSize || DB_CONSTANTS.DEFAULT_PAGE_SIZE,
        DB_CONSTANTS.MAX_PAGE_SIZE
      );
      const skip = (page - 1) * pageSize;

      // Get notes with pagination
      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          include: {
            folder: {
              select: { id: true, name: true, color: true },
            },
          },
        }),
        prisma.note.count({ where }),
      ]);

      return {
        notes,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasMore: skip + notes.length < total,
        },
      };
    } catch (error) {
      logger.error({ err: error, userId, filters }, "Failed to get notes");
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  static async getNoteById(noteId: string, userId: string) {
    try {
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
        include: {
          folder: {
            select: { id: true, name: true, color: true },
          },
          versions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              version: true,
              createdAt: true,
            },
          },
        },
      });

      if (!note) {
        return null;
      }

      // Log view
      logger.info({ event: LOG_EVENTS.NOTE_VIEWED, noteId, userId });

      return note;
    } catch (error) {
      logger.error({ err: error, noteId, userId }, "Failed to get note");
      throw error;
    }
  }

  /**
   * Create a new note
   */
  static async createNote(userId: string, data: CreateNoteData) {
    try {
      const note = await prisma.note.create({
        data: {
          ...data,
          userId,
          content: data.content || "",
        },
        include: {
          folder: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      logger.info({ event: LOG_EVENTS.NOTE_CREATED, noteId: note.id, userId });

      return note;
    } catch (error) {
      logger.error({ err: error, userId, data }, "Failed to create note");
      throw error;
    }
  }

  /**
   * Update a note
   */
  static async updateNote(
    noteId: string,
    userId: string,
    data: UpdateNoteData,
    createVersion: boolean = false
  ) {
    try {
      // Check ownership
      const existingNote = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });

      if (!existingNote) {
        return null;
      }

      // Create version if requested
      if (createVersion && (data.title || data.content)) {
        // Get latest version number
        const latestVersion = await prisma.noteVersion.findFirst({
          where: { noteId },
          orderBy: { version: 'desc' },
          select: { version: true },
        });
        
        const nextVersion = (latestVersion?.version || 0) + 1;
        
        await prisma.noteVersion.create({
          data: {
            noteId,
            title: existingNote.title,
            content: existingNote.content,
            contentFormat: existingNote.contentFormat,
            tags: existingNote.tags,
            version: nextVersion,
            createdBy: userId,
          },
        });
      }

      // Update note
      const note = await prisma.note.update({
        where: { id: noteId },
        data,
        include: {
          folder: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      logger.info({ event: LOG_EVENTS.NOTE_UPDATED, noteId, userId });

      return note;
    } catch (error) {
      logger.error({ err: error, noteId, userId, data }, "Failed to update note");
      throw error;
    }
  }

  /**
   * Delete a note (move to trash or permanent)
   */
  static async deleteNote(noteId: string, userId: string, permanent: boolean = false) {
    try {
      // Check ownership
      const existingNote = await prisma.note.findFirst({
        where: { id: noteId, userId },
      });

      if (!existingNote) {
        return null;
      }

      if (permanent) {
        // Permanent delete
        await prisma.note.delete({
          where: { id: noteId },
        });
      } else {
        // Move to trash
        await prisma.note.update({
          where: { id: noteId },
          data: {
            isTrashed: true,
            trashedAt: new Date(),
          },
        });
      }

      logger.info({ 
        event: LOG_EVENTS.NOTE_DELETED, 
        noteId, 
        userId, 
        permanent 
      });

      return true;
    } catch (error) {
      logger.error({ err: error, noteId, userId }, "Failed to delete note");
      throw error;
    }
  }

  /**
   * Restore a note from trash
   */
  static async restoreNote(noteId: string, userId: string) {
    try {
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId, isTrashed: true },
      });

      if (!note) {
        return null;
      }

      const restored = await prisma.note.update({
        where: { id: noteId },
        data: {
          isTrashed: false,
          trashedAt: null,
        },
      });

      logger.info({ noteId, userId }, "Note restored from trash");

      return restored;
    } catch (error) {
      logger.error({ err: error, noteId, userId }, "Failed to restore note");
      throw error;
    }
  }

  /**
   * Bulk delete notes
   */
  static async bulkDelete(noteIds: string[], userId: string, permanent: boolean = false) {
    try {
      if (permanent) {
        const result = await prisma.note.deleteMany({
          where: {
            id: { in: noteIds },
            userId,
          },
        });
        return result.count;
      } else {
        const result = await prisma.note.updateMany({
          where: {
            id: { in: noteIds },
            userId,
          },
          data: {
            isTrashed: true,
            trashedAt: new Date(),
          },
        });
        return result.count;
      }
    } catch (error) {
      logger.error({ err: error, noteIds, userId }, "Failed to bulk delete notes");
      throw error;
    }
  }

  /**
   * Bulk update notes
   */
  static async bulkUpdate(
    noteIds: string[],
    userId: string,
    data: Partial<UpdateNoteData>
  ) {
    try {
      const result = await prisma.note.updateMany({
        where: {
          id: { in: noteIds },
          userId,
        },
        data,
      });

      return result.count;
    } catch (error) {
      logger.error({ err: error, noteIds, userId, data }, "Failed to bulk update notes");
      throw error;
    }
  }

  /**
   * Search notes with full-text search
   */
  static async searchNotes(userId: string, query: string, limit: number = 20) {
    try {
      const notes = await prisma.note.findMany({
        where: {
          userId,
          isTrashed: false,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
            { tags: { hasSome: [query] } },
          ],
        },
        take: limit,
        orderBy: [
          { isFavorite: "desc" },
          { isPinned: "desc" },
          { updatedAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          color: true,
          isPinned: true,
          isFavorite: true,
          updatedAt: true,
        },
      });

      return notes;
    } catch (error) {
      logger.error({ err: error, userId, query }, "Failed to search notes");
      throw error;
    }
  }

  /**
   * Get note statistics for a user
   */
  static async getNoteStatistics(userId: string) {
    try {
      const [total, archived, trashed, pinned, favorited, byFolder, byTag] = 
        await Promise.all([
          // Total active notes
          prisma.note.count({
            where: { userId, isTrashed: false, isArchived: false },
          }),
          // Archived notes
          prisma.note.count({
            where: { userId, isArchived: true, isTrashed: false },
          }),
          // Trashed notes
          prisma.note.count({
            where: { userId, isTrashed: true },
          }),
          // Pinned notes
          prisma.note.count({
            where: { userId, isPinned: true, isTrashed: false },
          }),
          // Favorited notes
          prisma.note.count({
            where: { userId, isFavorite: true, isTrashed: false },
          }),
          // Notes by folder
          prisma.note.groupBy({
            by: ['folderId'],
            where: { userId, isTrashed: false },
            _count: true,
          }),
          // Notes by tag
          prisma.$queryRaw`
            SELECT unnest(tags) as tag, COUNT(*) as count
            FROM "Note"
            WHERE "userId" = ${userId} AND "isTrashed" = false
            GROUP BY tag
            ORDER BY count DESC
            LIMIT 10
          `,
        ]);

      return {
        total,
        archived,
        trashed,
        pinned,
        favorited,
        byFolder,
        topTags: byTag,
      };
    } catch (error) {
      logger.error({ err: error, userId }, "Failed to get note statistics");
      throw error;
    }
  }

  /**
   * Clean up old trashed notes (older than 30 days)
   */
  static async cleanupOldTrashedNotes() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.note.deleteMany({
        where: {
          isTrashed: true,
          trashedAt: { lt: thirtyDaysAgo },
        },
      });

      logger.info({ count: result.count }, "Cleaned up old trashed notes");

      return result.count;
    } catch (error) {
      logger.error({ err: error }, "Failed to cleanup old trashed notes");
      throw error;
    }
  }
}
