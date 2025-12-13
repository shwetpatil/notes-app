import { Router, Request, Response } from "express";
import { createNoteSchema, updateNoteSchema } from "@notes/types";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sanitizeMarkdown, sanitizeHtml } from "../middleware/sanitize";

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

export { router as notesRouter };
