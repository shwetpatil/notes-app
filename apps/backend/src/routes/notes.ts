import { Router, Request, Response } from "express";
import { createNoteSchema, updateNoteSchema } from "@notes/types";
import { prisma } from "../config";
import { requireAuth } from "../middleware/auth";
import { sanitizeMarkdown, sanitizeHtml } from "../middleware/sanitize";
import { suggestTags, normalizeTags } from "../utils/smartTags";

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notes - Get all notes for authenticated user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { search, tags, archived, trashed, sortBy = "updatedAt", order = "desc" } = req.query;

    // Build where clause
    const where: any = { userId };

    // Filter by trash status
    if (trashed === "true") {
      where.isTrashed = true;
    } else {
      where.isTrashed = false;
      
      // Filter by archived status (only for non-trashed)
      if (archived === "true") {
        where.isArchived = true;
      } else {
        where.isArchived = false;
      }
    }

    // Search in title and content
    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by tags
    if (tags && typeof tags === "string") {
      const tagArray = tags.split(",").filter(Boolean);
      if (tagArray.length > 0) {
        where.tags = { hasSome: tagArray };
      }
    }

    // Build orderBy
    const orderBy: any[] = [];
    
    // Favorites and pinned always on top
    if (trashed !== "true") {
      orderBy.push({ isFavorite: "desc" });
      orderBy.push({ isPinned: "desc" });
    }
    
    // Then sort by user preference
    const validSortFields = ["updatedAt", "createdAt", "title"];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : "updatedAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    orderBy.push({ [sortField as string]: sortOrder });

    const notes = await prisma.note.findMany({
      where,
      orderBy,
    });

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notes",
    });
  }
});

// GET /api/notes/:id - Get single note
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Get note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch note",
    });
  }
});

// POST /api/notes - Create note
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const parsed = createNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid note data",
      });
    }

    // Sanitize content to prevent XSS based on format
    let sanitizedContent = parsed.data.content;
    const contentFormat = parsed.data.contentFormat || "plaintext";
    
    if (contentFormat === "html") {
      sanitizedContent = sanitizeHtml(parsed.data.content);
    } else if (contentFormat === "markdown") {
      sanitizedContent = sanitizeMarkdown(parsed.data.content);
    }
    // plaintext doesn't need special sanitization, handled by general middleware
    
    const sanitizedData = {
      ...parsed.data,
      title: parsed.data.title.substring(0, 255), // Enforce max length
      content: sanitizedContent,
      userId,
    };

    const note = await prisma.note.create({
      data: sanitizedData,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create note",
    });
  }
});

// PATCH /api/notes/:id - Update note
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;
    const parsed = updateNoteSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid note data",
      });
    }

    // Verify ownership
    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    // Create version before updating (if content or title changed)
    if (parsed.data.content || parsed.data.title) {
      // Get current version count
      const versionCount = await prisma.noteVersion.count({
        where: { noteId: id },
      });

      // Save current version
      await prisma.noteVersion.create({
        data: {
          noteId: id,
          title: existingNote.title,
          content: existingNote.content,
          contentFormat: existingNote.contentFormat,
          tags: existingNote.tags,
          version: versionCount + 1,
          createdBy: userId,
        },
      });
    }

    // Sanitize content to prevent XSS based on format
    const sanitizedData: any = { ...parsed.data };
    if (sanitizedData.title) {
      sanitizedData.title = sanitizedData.title.substring(0, 255);
    }
    if (sanitizedData.content) {
      const contentFormat = sanitizedData.contentFormat || existingNote.contentFormat || "plaintext";
      
      if (contentFormat === "html") {
        sanitizedData.content = sanitizeHtml(sanitizedData.content);
      } else if (contentFormat === "markdown") {
        sanitizedData.content = sanitizeMarkdown(sanitizedData.content);
      }
      // plaintext doesn't need special sanitization
    }

    const note = await prisma.note.update({
      where: { id },
      data: sanitizedData,
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update note",
    });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    // Verify ownership
    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete note",
    });
  }
});

// PATCH /api/notes/:id/pin - Toggle pin status
router.patch("/:id/pin", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { isPinned: !existingNote.isPinned },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Pin note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to pin note",
    });
  }
});

// PATCH /api/notes/:id/archive - Toggle archive status
router.patch("/:id/archive", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { isArchived: !existingNote.isArchived },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Archive note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to archive note",
    });
  }
});

// PATCH /api/notes/:id/favorite - Toggle favorite status
router.patch("/:id/favorite", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { isFavorite: !existingNote.isFavorite },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Favorite note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to favorite note",
    });
  }
});

// PATCH /api/notes/:id/trash - Move to trash
router.patch("/:id/trash", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { 
        isTrashed: true,
        trashedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Trash note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to trash note",
    });
  }
});

// PATCH /api/notes/:id/restore - Restore from trash
router.patch("/:id/restore", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: { 
        isTrashed: false,
        trashedAt: null,
      },
    });

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Restore note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore note",
    });
  }
});

// DELETE /api/notes/:id/permanent - Permanently delete
router.delete("/:id/permanent", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const existingNote = await prisma.note.findFirst({
      where: { id, userId, isTrashed: true },
    });

    if (!existingNote) {
      return res.status(404).json({
        success: false,
        error: "Note not found in trash",
      });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Note permanently deleted",
    });
  } catch (error) {
    console.error("Permanent delete error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete note",
    });
  }
});

/**
 * GET /api/notes/:id/versions - Get complete version history for a note
 * 
 * @route GET /api/notes/:id/versions
 * @access Private - Requires authentication and note ownership
 * @param {string} id - Note ID from URL params
 * @returns {Object} 200 - Array of version objects, sorted by version number (newest first)
 * @returns {Object} 404 - Note not found or access denied
 * @returns {Object} 500 - Server error
 * 
 * Each version includes:
 * - Version number (incremental)
 * - Complete snapshot of title, content, and tags at that point
 * - Timestamp of when version was created
 * - User who created the version
 * 
 * Versions are automatically created when:
 * - Note title or content is updated
 * - Note is restored from a previous version (saves current state first)
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": [{
 *     "id": "ver123",
 *     "noteId": "note123",
 *     "version": 3,
 *     "title": "My Note",
 *     "content": "Updated content...",
 *     "contentFormat": "html",
 *     "tags": ["tag1", "tag2"],
 *     "createdAt": "2024-12-13T10:00:00Z"
 *   }]
 * }
 */
router.get("/:id/versions", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    // Verify ownership or shared access
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    const versions = await prisma.noteVersion.findMany({
      where: { noteId: id },
      orderBy: { version: "desc" },
    });

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error("Get versions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch versions",
    });
  }
});

/**
 * POST /api/notes/:id/restore/:versionId - Restore note to a previous version
 * 
 * @route POST /api/notes/:id/restore/:versionId
 * @access Private - Requires authentication and note ownership
 * @param {string} id - Note ID from URL params
 * @param {string} versionId - Version ID to restore from URL params
 * @returns {Object} 200 - Restored note object with success message
 * @returns {Object} 404 - Note or version not found
 * @returns {Object} 500 - Server error
 * 
 * Process:
 * 1. Validates note ownership and version existence
 * 2. Saves current note state as a new version (preserves current work)
 * 3. Restores note to selected version's title, content, and tags
 * 4. Returns updated note object
 * 
 * Safety:
 * - Current state is ALWAYS saved before restore (no data loss)
 * - Version number increments with each save
 * - Original version remains in history
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": { ...restoredNoteObject },
 *   "message": "Restored to version 2"
 * }
 */
router.post("/:id/restore/:versionId", async (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.session.user!.id;

    // Verify ownership
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    // Get version to restore
    const version = await prisma.noteVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.noteId !== id) {
      return res.status(404).json({
        success: false,
        error: "Version not found",
      });
    }

    // Save current state as a version before restoring
    const versionCount = await prisma.noteVersion.count({
      where: { noteId: id },
    });

    await prisma.noteVersion.create({
      data: {
        noteId: id,
        title: note.title,
        content: note.content,
        contentFormat: note.contentFormat,
        tags: note.tags,
        version: versionCount + 1,
        createdBy: userId,
      },
    });

    // Restore the version
    const restoredNote = await prisma.note.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content,
        contentFormat: version.contentFormat,
        tags: version.tags,
      },
    });

    res.json({
      success: true,
      data: restoredNote,
      message: `Restored to version ${version.version}`,
    });
  } catch (error) {
    console.error("Restore version error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to restore version",
    });
  }
});

/**
 * POST /api/notes/suggest-tags - Generate intelligent tag suggestions
 * 
 * @route POST /api/notes/suggest-tags
 * @access Private - Requires authentication
 * @body {Object} Note content for analysis
 * @param {string} [body.title] - Note title to analyze
 * @param {string} [body.content] - Note content to analyze
 * @param {string[]} [body.existingTags] - Tags already applied (excluded from suggestions)
 * @returns {Object} 200 - Suggested tags and all user's existing tags
 * @returns {Object} 400 - Neither title nor content provided
 * @returns {Object} 500 - Server error
 * 
 * Algorithm analyzes:
 * 1. Hashtags in content (#tag) - highest priority
 * 2. Technical/programming keywords (50+ terms)
 * 3. Frequently occurring words in title (weighted)
 * 4. Frequently occurring words in content (2+ occurrences)
 * 5. Capitalized words (potential proper nouns)
 * 
 * Response includes:
 * - suggestions: Array of 8 smart tag suggestions (normalized, sorted by relevance)
 * - userTags: All unique tags user has used across all notes (for autocomplete)
 * 
 * @example
 * // Request body:
 * {
 *   "title": "Building React Apps",
 *   "content": "Learn #javascript and #react for web development...",
 *   "existingTags": ["tutorial"]
 * }
 * 
 * // Success response:
 * {
 *   "success": true,
 *   "data": {
 *     "suggestions": ["javascript", "react", "web", "building", "development"],
 *     "userTags": ["javascript", "react", "tutorial", "web", ...]
 *   }
 * }
 */
router.post("/suggest-tags", async (req: Request, res: Response) => {
  try {
    const { title, content, existingTags = [] } = req.body;

    if (!title && !content) {
      return res.status(400).json({
        success: false,
        error: "Title or content is required",
      });
    }

    const suggestions = suggestTags(
      title || "",
      content || "",
      existingTags,
      8 // Get more suggestions
    );

    // Get all user's tags for related suggestions
    const userNotes = await prisma.note.findMany({
      where: { userId: req.session.user!.id },
      select: { tags: true },
    });

    const allUserTags = userNotes.flatMap((note) => note.tags);

    res.json({
      success: true,
      data: {
        suggestions: normalizeTags(suggestions),
        userTags: [...new Set(allUserTags)].sort(),
      },
    });
  } catch (error) {
    console.error("Smart tags error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate tag suggestions",
    });
  }
});

export { router as notesRouter };
