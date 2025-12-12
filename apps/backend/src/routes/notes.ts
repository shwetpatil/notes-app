import { Router, Request, Response } from "express";
import { createNoteSchema, updateNoteSchema } from "@notes/types";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/notes - Get all notes for authenticated user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { search, tags, archived } = req.query;

    // Build where clause
    const where: any = { userId };

    // Filter by archived status
    if (archived === "true") {
      where.isArchived = true;
    } else {
      where.isArchived = false;
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

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
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
        error: "Invalid input",
        details: parsed.error.issues,
      });
    }

    const note = await prisma.note.create({
      data: {
        ...parsed.data,
        userId,
      },
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
        error: "Invalid input",
        details: parsed.error.issues,
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

    const note = await prisma.note.update({
      where: { id },
      data: parsed.data,
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

export { router as notesRouter };
