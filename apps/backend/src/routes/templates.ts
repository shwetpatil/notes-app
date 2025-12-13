import { Router, Request, Response } from "express";
import { createTemplateSchema, updateTemplateSchema } from "@notes/types";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { sanitizeMarkdown, sanitizeHtml } from "../middleware/sanitize";

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/templates - Get all templates for authenticated user
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { sortBy = "updatedAt", order = "desc" } = req.query;

    // Build orderBy
    const validSortFields = ["updatedAt", "createdAt", "name"];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : "updatedAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const templates = await prisma.template.findMany({
      where: { userId },
      orderBy: { [sortField as string]: sortOrder },
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch templates",
    });
  }
});

// GET /api/templates/:id - Get single template
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    const template = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch template",
    });
  }
});

// POST /api/templates - Create template
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const parsed = createTemplateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid template data",
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
    
    const sanitizedData = {
      ...parsed.data,
      name: parsed.data.name.substring(0, 255),
      content: sanitizedContent,
      userId,
    };

    const template = await prisma.template.create({
      data: sanitizedData,
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create template",
    });
  }
});

// PATCH /api/templates/:id - Update template
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;
    const parsed = updateTemplateSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid template data",
      });
    }

    // Verify ownership
    const existingTemplate = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    // Sanitize content to prevent XSS based on format
    const sanitizedData: any = { ...parsed.data };
    if (sanitizedData.name) {
      sanitizedData.name = sanitizedData.name.substring(0, 255);
    }
    if (sanitizedData.content) {
      const contentFormat = sanitizedData.contentFormat || existingTemplate.contentFormat || "plaintext";
      
      if (contentFormat === "html") {
        sanitizedData.content = sanitizeHtml(sanitizedData.content);
      } else if (contentFormat === "markdown") {
        sanitizedData.content = sanitizeMarkdown(sanitizedData.content);
      }
    }

    const template = await prisma.template.update({
      where: { id },
      data: sanitizedData,
    });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update template",
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.session.user!.id;

    // Verify ownership
    const template = await prisma.template.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        error: "Template not found",
      });
    }

    await prisma.template.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete template error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete template",
    });
  }
});

export default router;
