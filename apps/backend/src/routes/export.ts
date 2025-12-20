import { Router, Request, Response } from "express";
import { prisma } from "../config";
import { requireAuth } from "../middleware/auth";
import puppeteer from "puppeteer";
import MarkdownIt from "markdown-it";

const router: Router = Router();
const md = new MarkdownIt();

// All routes require authentication
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/export/{id}/{format}:
 *   get:
 *     summary: Export a note in specified format
 *     tags: [Export]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, markdown, json, html]
 *         description: Export format
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/markdown:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid format
 *       403:
 *         description: Access denied
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 * GET /api/export/:id/:format - Export a single note in specified format
 * 
 * @route GET /api/export/:id/:format
 * @access Private - Requires authentication and note access (owner or shared)
 * @param {string} id - Note ID from URL params
 * @param {string} format - Export format: "pdf", "markdown", "json", or "html"
 * @returns {File} 200 - Downloaded file in requested format
 * @returns {Object} 400 - Invalid format specified
 * @returns {Object} 403 - Access denied (not owner, no share access)
 * @returns {Object} 404 - Note not found
 * @returns {Object} 500 - Export generation failed
 * 
 * Supported formats:
 * - **pdf**: Styled PDF with metadata, generated via Puppeteer
 * - **markdown**: Plain text with metadata header and stripped HTML
 * - **json**: Complete note data with all metadata and timestamps
 * - **html**: Styled standalone HTML document with embedded CSS
 * 
 * Access control:
 * - Note owner has full access
 * - Users with active share access (non-expired) can export
 * 
 * @example
 * // Export as PDF:
 * GET /api/export/note123/pdf
 * // Downloads: my-note.pdf
 * 
 * // Export as Markdown:
 * GET /api/export/note123/markdown
 * // Downloads: my-note.md
 */
router.get("/:id/:format", async (req: Request, res: Response) => {
  try {
    const { id, format } = req.params;

    // Validate format
    if (!["pdf", "markdown", "json", "html"].includes(format)) {
      return res.status(400).json({
        success: false,
        error: "Invalid export format. Use: pdf, markdown, json, or html",
      });
    }

    // Fetch note
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: "Note not found",
      });
    }

    // Check access (owner or shared with)
    const hasAccess =
      note.userId === req.session.user!.id ||
      (await prisma.noteShare.findFirst({
        where: {
          noteId: id,
          sharedWith: req.session.user!.email,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    // Export based on format
    switch (format) {
      case "json":
        return exportJSON(note, res);

      case "markdown":
        return exportMarkdown(note, res);

      case "html":
        return exportHTML(note, res);

      case "pdf":
        return await exportPDF(note, res);

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid format",
        });
    }
  } catch (error) {
    logger.error({ error }, 'Error exporting note');
    res.status(500).json({
      success: false,
      error: "Failed to export note",
    });
  }
});

/**
 * POST /api/export/bulk - Export multiple notes as single JSON file
 * 
 * @route POST /api/export/bulk
 * @access Private - Requires authentication, exports only owned notes
 * @body {Object} Export configuration
 * @param {string[]} body.noteIds - Array of note IDs to export (required)
 * @param {string} [body.format] - Export format (currently only "json" supported)
 * @returns {File} 200 - JSON file with all notes and metadata
 * @returns {Object} 400 - Missing or invalid noteIds array
 * @returns {Object} 404 - No notes found (wrong IDs or access denied)
 * @returns {Object} 500 - Export generation failed
 * 
 * Output structure:
 * - exportedAt: timestamp of export
 * - notesCount: number of notes included
 * - notes: array of complete note objects
 * 
 * Security:
 * - Only exports notes owned by authenticated user
 * - Ignores notes user doesn't own (silent filtering)
 * 
 * @example
 * // Request body:
 * {
 *   "noteIds": ["note1", "note2", "note3"],
 *   "format": "json"
 * }
 * 
 * // Response downloads: notes-export-1702468800000.json
 * {
 *   "exportedAt": "2024-12-13T10:00:00.000Z",
 *   "notesCount": 3,
 *   "notes": [...noteObjects]
 * }
 */
router.post("/bulk", async (req: Request, res: Response) => {
  try {
    const { noteIds, format = "json" } = req.body;

    if (!noteIds || !Array.isArray(noteIds)) {
      return res.status(400).json({
        success: false,
        error: "noteIds array is required",
      });
    }

    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
        userId: req.session.user!.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No notes found",
      });
    }

    // Export as JSON with all notes
    const exportData = {
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        contentFormat: note.contentFormat,
        tags: note.tags,
        color: note.color,
        isPinned: note.isPinned,
        isFavorite: note.isFavorite,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };

    const filename = `notes-export-${Date.now()}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    logger.error({ error }, 'Error bulk exporting notes');
    res.status(500).json({
      success: false,
      error: "Failed to export notes",
    });
  }
});

// Helper functions

/**
 * Exports a note as JSON format with complete metadata
 * Includes all note properties, timestamps, and author information
 * 
 * @param note - The note object to export (from Prisma with user relation)
 * @param res - Express response object to send the file
 * @returns void - Sends JSON file as attachment
 * 
 * @example
 * // Response headers set:
 * // Content-Type: application/json
 * // Content-Disposition: attachment; filename="my-note.json"
 */
function exportJSON(note: any, res: Response) {
  const exportData = {
    id: note.id,
    title: note.title,
    content: note.content,
    contentFormat: note.contentFormat,
    tags: note.tags,
    color: note.color,
    isPinned: note.isPinned,
    isFavorite: note.isFavorite,
    isArchived: note.isArchived,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    author: {
      name: note.user.name,
      email: note.user.email,
    },
  };

  const filename = `${sanitizeFilename(note.title)}.json`;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exportData, null, 2));
}

/**
 * Exports a note as Markdown format with metadata header
 * Strips HTML tags if content is in HTML format
 * 
 * @param note - The note object to export
 * @param res - Express response object to send the file
 * @returns void - Sends Markdown file as attachment
 * 
 * Output format:
 * ```markdown
 * # Title
 * 
 * **Created**: Date
 * **Updated**: Date
 * **Tags**: tag1, tag2
 * 
 * ---
 * 
 * Content here...
 * ```
 */
function exportMarkdown(note: any, res: Response) {
  let markdown = `# ${note.title}\n\n`;

  // Add metadata
  markdown += `**Created**: ${new Date(note.createdAt).toLocaleDateString()}\n`;
  markdown += `**Updated**: ${new Date(note.updatedAt).toLocaleDateString()}\n`;
  if (note.tags.length > 0) {
    markdown += `**Tags**: ${note.tags.join(", ")}\n`;
  }
  markdown += `\n---\n\n`;

  // Add content
  if (note.contentFormat === "html") {
    // Strip HTML tags for markdown export (basic conversion)
    markdown += note.content.replace(/<[^>]*>/g, "");
  } else {
    markdown += note.content;
  }

  const filename = `${sanitizeFilename(note.title)}.md`;

  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(markdown);
}

/**
 * Exports a note as styled HTML document
 * Converts markdown to HTML if needed, applies CSS styling
 * 
 * @param note - The note object to export
 * @param res - Express response object to send the file
 * @returns void - Sends HTML file as attachment
 * 
 * Features:
 * - Responsive design with max-width 800px
 * - Styled metadata section
 * - Tag badges
 * - Code syntax styling
 * - Print-friendly formatting
 */
function exportHTML(note: any, res: Response) {
  let htmlContent = note.content;

  // Convert markdown to HTML if needed
  if (note.contentFormat === "markdown") {
    htmlContent = md.render(note.content);
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .metadata {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 30px;
    }
    .tags {
      margin-top: 20px;
    }
    .tag {
      display: inline-block;
      background: #ecf0f1;
      padding: 4px 12px;
      border-radius: 12px;
      margin-right: 8px;
      font-size: 0.85em;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="metadata">
    <p><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
    <p><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</p>
    <p><strong>Author:</strong> ${note.user.name}</p>
  </div>
  <div class="content">
    ${htmlContent}
  </div>
  ${
    note.tags.length > 0
      ? `
  <div class="tags">
    <strong>Tags:</strong><br>
    ${note.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
  </div>
  `
      : ""
  }
</body>
</html>
  `;

  const filename = `${sanitizeFilename(note.title)}.html`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(html);
}

/**
 * Exports a note as PDF using Puppeteer (headless Chrome)
 * Generates styled HTML, converts markdown if needed, then renders to PDF
 * 
 * @param note - The note object to export
 * @param res - Express response object to send the file
 * @returns Promise<void> - Sends PDF file as attachment
 * @throws Error if Puppeteer fails to launch or PDF generation fails
 * 
 * PDF Settings:
 * - Format: A4
 * - Margins: 20mm all sides
 * - Background graphics: enabled
 * - Styled similar to HTML export
 * 
 * Note: Requires Chrome/Chromium to be installed (handled by puppeteer)
 */
async function exportPDF(note: any, res: Response) {
  let browser;
  try {
    // Generate HTML first
    let htmlContent = note.content;

    if (note.contentFormat === "markdown") {
      htmlContent = md.render(note.content);
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 40px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .metadata {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 30px;
      padding: 15px;
      background: #f8f9fa;
      border-left: 4px solid #3498db;
    }
    .tags {
      margin-top: 30px;
    }
    .tag {
      display: inline-block;
      background: #ecf0f1;
      padding: 4px 12px;
      border-radius: 12px;
      margin-right: 8px;
      font-size: 0.85em;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="metadata">
    <p><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
    <p><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</p>
    <p><strong>Author:</strong> ${note.user.name}</p>
  </div>
  <div class="content">
    ${htmlContent}
  </div>
  ${
    note.tags.length > 0
      ? `
  <div class="tags">
    <strong>Tags:</strong><br>
    ${note.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
  </div>
  `
      : ""
  }
</body>
</html>
    `;

    // Launch browser and generate PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      printBackground: true,
    });

    await browser.close();

    const filename = `${sanitizeFilename(note.title)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Sanitizes a filename to be safe for filesystem operations
 * Removes special characters and limits length
 * 
 * @param filename - The raw filename to sanitize
 * @returns Sanitized filename with only alphanumeric and underscores, max 50 chars
 * 
 * @example
 * sanitizeFilename("My Note: API Design (v2)!")
 * // Returns: "My_Note_API_Design_v2"
 * 
 * sanitizeFilename("A".repeat(100))
 * // Returns: "A".repeat(50)
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .substring(0, 50);
}

/**
 * @swagger
 * /api/v1/export/bulk:
 *   post:
 *     summary: Bulk export multiple notes
 *     tags: [Export]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               noteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               format:
 *                 type: string
 *                 enum: [json, markdown, html]
 *     responses:
 *       200:
 *         description: ZIP file containing all notes
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post("/bulk", async (req: Request, res: Response) => {
  try {
    const { noteIds, format = "markdown" } = req.body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "noteIds array is required",
      });
    }

    if (noteIds.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Maximum 100 notes per bulk export",
      });
    }

    // Fetch all notes
    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
        userId: req.session.user!.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (notes.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No notes found",
      });
    }

    // For simplicity, create a JSON array of all notes
    // In production, create a ZIP file with individual files
    const exportData = {
      exported_at: new Date().toISOString(),
      notes_count: notes.length,
      format,
      notes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        isPinned: note.isPinned,
        isFavorite: note.isFavorite,
        isArchived: note.isArchived,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };

    const filename = `notes-export-${Date.now()}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    logger.error({ error }, 'Bulk export error');
    res.status(500).json({
      success: false,
      error: "Failed to export notes",
    });
  }
});

export default router;
