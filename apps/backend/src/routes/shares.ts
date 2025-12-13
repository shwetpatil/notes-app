import { Router, Request, Response } from "express";
import { createShareSchema, updateShareSchema } from "@notes/types";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * POST /api/shares - Share a note with another user via email
 * 
 * @route POST /api/shares
 * @access Private - Requires authentication and note ownership
 * @body {Object} Share data validated against createShareSchema
 * @param {string} body.noteId - ID of note to share (required)
 * @param {string} body.sharedWith - Email address of recipient (required)
 * @param {string} body.permission - "view" or "edit" (required)
 * @param {string} [body.expiresAt] - ISO date string for expiration (optional)
 * @returns {Object} 200 - Created share object
 * @returns {Object} 400 - Validation error or duplicate share
 * @returns {Object} 403 - Not note owner
 * @returns {Object} 404 - Note not found
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // Request body:
 * {
 *   "noteId": "note123",
 *   "sharedWith": "colleague@example.com",
 *   "permission": "edit",
 *   "expiresAt": "2024-12-31T23:59:59Z" // optional
 * }
 * 
 * // Success response:
 * {
 *   "success": true,
 *   "data": { ...shareObject },
 *   "message": "Note shared with colleague@example.com"
 * }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const result = createShareSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: result.error.message,
      });
    }

    const { noteId, sharedWith, permission, expiresAt } = result.data;

    // Verify note ownership
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    if (note.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "You can only share your own notes",
      });
    }

    // Create share
    const share = await prisma.noteShare.create({
      data: {
        noteId,
        sharedWith,
        permission,
        sharedBy: req.session.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.json({
      success: true,
      data: share,
      message: `Note shared with ${sharedWith}`,
    });
  } catch (error: any) {
    console.error("Error creating share:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        error: "Note already shared with this user",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to share note",
    });
  }
});

/**
 * GET /api/shares/note/:noteId - Get all active shares for a note
 * 
 * @route GET /api/shares/note/:noteId
 * @access Private - Requires authentication and note ownership
 * @param {string} noteId - Note ID from URL params
 * @returns {Object} 200 - Array of share objects
 * @returns {Object} 403 - Not note owner
 * @returns {Object} 404 - Note not found
 * @returns {Object} 500 - Server error
 * 
 * Returns all shares (active and expired) for management purposes
 * Sorted by creation date (most recent first)
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": [{
 *     "id": "share123",
 *     "noteId": "note123",
 *     "sharedWith": "user@example.com",
 *     "permission": "view",
 *     "expiresAt": "2024-12-31T23:59:59Z",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   }]
 * }
 */
router.get("/note/:noteId", async (req: Request, res: Response) => {
  try {
    // Verify note ownership
    const note = await prisma.note.findUnique({
      where: { id: req.params.noteId },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    if (note.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const shares = await prisma.noteShare.findMany({
      where: { noteId: req.params.noteId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: shares,
    });
  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shares",
    });
  }
});

/**
 * GET /api/shares/shared-with-me - Get all notes shared with authenticated user
 * 
 * @route GET /api/shares/shared-with-me
 * @access Private - Requires authentication
 * @returns {Object} 200 - Array of shares with note and owner details
 * @returns {Object} 500 - Server error
 * 
 * Filters:
 * - Only shows non-expired shares (expiresAt is null or in future)
 * - Matches against user's email address
 * - Includes complete note object and owner information
 * - Sorted by share creation date (most recent first)
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": [{
 *     "id": "share123",
 *     "permission": "edit",
 *     "note": {
 *       "id": "note123",
 *       "title": "Shared Document",
 *       "content": "...",
 *       "user": {
 *         "id": "owner123",
 *         "name": "John Doe",
 *         "email": "john@example.com"
 *       }
 *     }
 *   }]
 * }
 */
router.get("/shared-with-me", async (req: Request, res: Response) => {
  try {
    const shares = await prisma.noteShare.findMany({
      where: {
        sharedWith: req.session.user!.email,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        note: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: shares,
    });
  } catch (error) {
    console.error("Error fetching shared notes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch shared notes",
    });
  }
});

/**
 * PATCH /api/shares/:id - Update share permissions or expiration
 * 
 * @route PATCH /api/shares/:id
 * @access Private - Requires authentication and note ownership
 * @param {string} id - Share ID from URL params
 * @body {Object} Update data validated against updateShareSchema
 * @param {string} [body.permission] - New permission level ("view" or "edit")
 * @param {string} [body.expiresAt] - New expiration date (ISO string)
 * @returns {Object} 200 - Updated share object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 403 - Not note owner
 * @returns {Object} 404 - Share not found
 * @returns {Object} 500 - Server error
 * 
 * Use cases:
 * - Upgrade/downgrade permissions (view ↔ edit)
 * - Extend or shorten expiration time
 * - Remove expiration by setting to null
 * 
 * @example
 * // Request body (all fields optional):
 * {
 *   "permission": "view",
 *   "expiresAt": "2025-12-31T23:59:59Z"
 * }
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const result = updateShareSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: result.error.message,
      });
    }

    // Verify ownership
    const existingShare = await prisma.noteShare.findUnique({
      where: { id: req.params.id },
      include: { note: true },
    });

    if (!existingShare) {
      return res.status(404).json({
        success: false,
        error: "Share not found",
      });
    }

    if (existingShare.note.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const share = await prisma.noteShare.update({
      where: { id: req.params.id },
      data: {
        ...result.data,
        expiresAt: result.data.expiresAt ? new Date(result.data.expiresAt) : undefined,
      },
    });

    res.json({
      success: true,
      data: share,
    });
  } catch (error) {
    console.error("Error updating share:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update share",
    });
  }
});

/**
 * DELETE /api/shares/:id - Revoke note sharing access
 * 
 * @route DELETE /api/shares/:id
 * @access Private - Requires authentication and note ownership
 * @param {string} id - Share ID from URL params
 * @returns {Object} 200 - Success confirmation
 * @returns {Object} 403 - Not note owner
 * @returns {Object} 404 - Share not found
 * @returns {Object} 500 - Server error
 * 
 * Immediately revokes access for the shared user
 * The recipient will no longer see the note in their "shared-with-me" list
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "message": "Share revoked successfully"
 * }
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Verify ownership
    const existingShare = await prisma.noteShare.findUnique({
      where: { id: req.params.id },
      include: { note: true },
    });

    if (!existingShare) {
      return res.status(404).json({
        success: false,
        error: "Share not found",
      });
    }

    if (existingShare.note.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    await prisma.noteShare.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Share revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking share:", error);
    res.status(500).json({
      success: false,
      error: "Failed to revoke share",
    });
  }
});

export default router;
