// Example: Notes route with caching and WebSocket integration
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache';
import { NoteService } from '../services/note.service';
import { emitNoteUpdate } from '../config/websocket';
import { validateBody, validateQuery } from '../middleware/validation';
import { z } from 'zod';
import logger from '../config/logger';

const router = Router();
const noteService = new NoteService();

// All routes require authentication
router.use(requireAuth);

// Validation schemas
const getNotesPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z.string().optional(),
  archived: z.coerce.boolean().optional(),
  trashed: z.coerce.boolean().optional(),
});

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(100000),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(100000).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().optional().nullable(),
  isArchived: z.boolean().optional(),
  isTrashed: z.boolean().optional(),
});

// GET /api/v1/notes - Get all notes with caching
router.get(
  '/',
  cacheMiddleware(300), // Cache for 5 minutes
  validateQuery(getNotesPaginationSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { page, pageSize, search, tags, archived, trashed } = req.query as any;

      const filters: any = {};
      if (search) filters.search = search;
      if (tags) filters.tags = tags.split(',');
      if (archived !== undefined) filters.archived = archived;
      if (trashed !== undefined) filters.trashed = trashed;

      const result = await noteService.getNotes(userId, page, pageSize, filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching notes');
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notes',
      });
    }
  }
);

// POST /api/v1/notes - Create note with cache invalidation and WebSocket
router.post(
  '/',
  invalidateCacheMiddleware(['notes:user:*', 'route:/api/v1/notes*']),
  validateBody(createNoteSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const noteData = req.body;

      const note = await noteService.createNote(userId, noteData);

      // Emit WebSocket event for real-time update
      emitNoteUpdate({
        noteId: note.id,
        action: 'create',
        userId,
        data: note,
      });

      logger.info({ userId, noteId: note.id }, 'Note created');

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (error) {
      logger.error({ error }, 'Error creating note');
      res.status(500).json({
        success: false,
        error: 'Failed to create note',
      });
    }
  }
);

// PATCH /api/v1/notes/:id - Update note with cache invalidation and WebSocket
router.patch(
  '/:id',
  invalidateCacheMiddleware(['notes:user:*', 'note:*', 'route:/api/v1/notes*']),
  validateBody(updateNoteSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const updates = req.body;

      const note = await noteService.updateNote(id, userId, updates);

      // Emit WebSocket event for real-time update
      emitNoteUpdate({
        noteId: id,
        action: 'update',
        userId,
        data: note,
      });

      logger.info({ userId, noteId: id }, 'Note updated');

      res.json({
        success: true,
        data: note,
      });
    } catch (error) {
      logger.error({ error, noteId: req.params.id }, 'Error updating note');
      res.status(500).json({
        success: false,
        error: 'Failed to update note',
      });
    }
  }
);

// DELETE /api/v1/notes/:id - Delete note with cache invalidation and WebSocket
router.delete(
  '/:id',
  invalidateCacheMiddleware(['notes:user:*', 'note:*', 'route:/api/v1/notes*']),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;

      await noteService.deleteNote(id, userId);

      // Emit WebSocket event for real-time update
      emitNoteUpdate({
        noteId: id,
        action: 'delete',
        userId,
      });

      logger.info({ userId, noteId: id }, 'Note deleted');

      res.json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      logger.error({ error, noteId: req.params.id }, 'Error deleting note');
      res.status(500).json({
        success: false,
        error: 'Failed to delete note',
      });
    }
  }
);

// POST /api/v1/notes/bulk-delete - Bulk delete with cache invalidation and WebSocket
router.post(
  '/bulk-delete',
  invalidateCacheMiddleware(['notes:user:*', 'route:/api/v1/notes*']),
  validateBody(z.object({ noteIds: z.array(z.string().uuid()) })),
  async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { noteIds } = req.body;

      const result = await noteService.bulkDelete(userId, noteIds);

      // Emit WebSocket events for each deleted note
      noteIds.forEach((noteId) => {
        emitNoteUpdate({
          noteId,
          action: 'delete',
          userId,
        });
      });

      logger.info({ userId, count: result.count }, 'Bulk delete completed');

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error({ error }, 'Error bulk deleting notes');
      res.status(500).json({
        success: false,
        error: 'Failed to delete notes',
      });
    }
  }
);

export default router;
