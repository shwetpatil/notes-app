import { Router, Request, Response } from "express";
import { createFolderSchema, updateFolderSchema } from "@notes/types";
import { prisma } from "../config";
import { requireAuth } from "../middleware/auth";

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/folders - Get all folders for authenticated user
 * 
 * @route GET /api/folders
 * @access Private - Requires authentication
 * @returns {Object} 200 - Success response with folders array
 * @returns {Object} 500 - Server error
 * 
 * Response includes:
 * - Folder metadata (id, name, icon, color, parentId)
 * - Note count per folder
 * - Subfolder count
 * - Sorted by most recently updated
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": [{
 *     "id": "abc123",
 *     "name": "Work Notes",
 *     "icon": "📁",
 *     "color": "#3498db",
 *     "_count": { "notes": 15, "subFolders": 3 }
 *   }]
 * }
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.session.user!.id },
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch folders",
    });
  }
});

/**
 * POST /api/folders - Create a new folder
 * 
 * @route POST /api/folders
 * @access Private - Requires authentication
 * @body {Object} Folder data validated against createFolderSchema
 * @param {string} body.name - Folder name (required)
 * @param {string} [body.icon] - Folder icon emoji
 * @param {string} [body.color] - Folder color hex code
 * @param {string} [body.parentId] - Parent folder ID for nesting
 * @returns {Object} 200 - Created folder object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // Request body:
 * {
 *   "name": "Project Ideas",
 *   "icon": "💡",
 *   "color": "#f39c12",
 *   "parentId": "parent-folder-id" // optional, for nested folders
 * }
 * 
 * // Success response:
 * {
 *   "success": true,
 *   "data": { ...folderObject }
 * }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const result = createFolderSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: result.error.message,
      });
    }

    const folder = await prisma.folder.create({
      data: {
        ...result.data,
        userId: req.session.user!.id,
      },
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create folder",
    });
  }
});

/**
 * GET /api/folders/:id - Get folder details with notes and subfolders
 * 
 * @route GET /api/folders/:id
 * @access Private - Requires authentication and ownership
 * @param {string} id - Folder ID from URL params
 * @returns {Object} 200 - Folder with notes and subfolders
 * @returns {Object} 403 - Access denied (not owner)
 * @returns {Object} 404 - Folder not found
 * @returns {Object} 500 - Server error
 * 
 * Response includes:
 * - Complete folder details
 * - All notes in the folder (with user info)
 * - All immediate subfolders (with note counts)
 * - Aggregate counts
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "abc123",
 *     "name": "Work",
 *     "notes": [...noteObjects],
 *     "subFolders": [...subFolderObjects],
 *     "_count": { "notes": 10, "subFolders": 2 }
 *   }
 * }
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: req.params.id },
      include: {
        notes: {
          where: {
            isTrashed: false,
          },
          orderBy: [
            { isPinned: "desc" },
            { updatedAt: "desc" },
          ],
        },
        subFolders: {
          include: {
            _count: {
              select: {
                notes: true,
              },
            },
          },
        },
        _count: {
          select: {
            notes: true,
            subFolders: true,
          },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    // Check ownership
    if (folder.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch folder",
    });
  }
});

/**
 * PATCH /api/folders/:id - Update folder properties
 * 
 * @route PATCH /api/folders/:id
 * @access Private - Requires authentication and ownership
 * @param {string} id - Folder ID from URL params
 * @body {Object} Update data validated against updateFolderSchema
 * @param {string} [body.name] - New folder name
 * @param {string} [body.icon] - New folder icon
 * @param {string} [body.color] - New folder color
 * @param {string} [body.parentId] - New parent folder (for moving)
 * @returns {Object} 200 - Updated folder object
 * @returns {Object} 400 - Validation error
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Folder not found
 * @returns {Object} 500 - Server error
 * 
 * @example
 * // Request body (all fields optional):
 * {
 *   "name": "Renamed Folder",
 *   "color": "#e74c3c"
 * }
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const result = updateFolderSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: result.error.message,
      });
    }

    // Check ownership
    const existingFolder = await prisma.folder.findUnique({
      where: { id: req.params.id },
    });

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    if (existingFolder.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data: result.data,
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update folder",
    });
  }
});

/**
 * DELETE /api/folders/:id - Delete folder and handle contained notes
 * 
 * @route DELETE /api/folders/:id
 * @access Private - Requires authentication and ownership
 * @param {string} id - Folder ID from URL params
 * @returns {Object} 200 - Success confirmation
 * @returns {Object} 403 - Access denied
 * @returns {Object} 404 - Folder not found
 * @returns {Object} 500 - Server error
 * 
 * Behavior:
 * - All notes in the folder are moved to root (folderId set to null)
 * - Subfolders are cascade deleted (Prisma relation)
 * - Ensures no notes are lost during deletion
 * 
 * @example
 * // Success response:
 * {
 *   "success": true,
 *   "message": "Folder deleted successfully"
 * }
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Check ownership
    const existingFolder = await prisma.folder.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            notes: true,
            subFolders: true,
          },
        },
      },
    });

    if (!existingFolder) {
      return res.status(404).json({
        success: false,
        error: "Folder not found",
      });
    }

    if (existingFolder.userId !== req.session.user!.id) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Move notes out of folder before deletion
    await prisma.note.updateMany({
      where: { folderId: req.params.id },
      data: { folderId: null },
    });

    // Delete folder (cascades to subfolders)
    await prisma.folder.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete folder",
    });
  }
});

export default router;
