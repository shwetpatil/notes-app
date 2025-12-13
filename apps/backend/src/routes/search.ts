import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { searchService } from '../services/search.service';
import { z } from 'zod';
import { logger } from '../config/logger.config';
import { cacheMiddleware } from '../middleware/cache';

const router: Router = Router();

// All routes require authentication
router.use(requireAuth);

// Search schema
const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  includeShared: z.coerce.boolean().optional().default(true),
});

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Full-text search for notes
 *     tags: [Search]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Search query
 *         example: javascript async
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: includeShared
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include shared notes in results
 *     responses:
 *       200:
 *         description: Search results with relevance ranking
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchResult'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/',
  cacheMiddleware(180), // Cache for 3 minutes
  async (req: Request, res: Response) => {
    // Validate query parameters
    const validation = searchSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
    }
    try {
      const userId = req.session.user!.id;
      const { q, limit, offset, includeShared } = req.query as any;

      const result = await searchService.searchNotes({
        query: q,
        userId,
        limit,
        offset,
        includeShared,
      });

      logger.info({ userId, query: q, resultsCount: result.notes.length }, 'Search performed');

      res.json({
        success: true,
        data: {
          notes: result.notes,
          pagination: {
            total: result.total,
            limit,
            offset,
            hasMore: offset + limit < result.total,
          },
        },
      });
    } catch (error) {
      logger.error({ error }, 'Search error');
      res.status(500).json({
        success: false,
        error: 'Search failed',
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/search/suggestions:
 *   get:
 *     summary: Get autocomplete suggestions
 *     tags: [Search]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: Text prefix for suggestions
 *         example: java
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum suggestions to return
 *     responses:
 *       200:
 *         description: List of suggestions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { prefix, limit = 10 } = req.query;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prefix is required',
      });
    }

    const suggestions = await searchService.getSuggestions(
      userId,
      prefix,
      Number(limit)
    );

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    logger.error({ error }, 'Suggestions error');
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
    });
  }
});

// GET /api/v1/search/tags - Search by tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { tags, limit = 20, offset = 0 } = req.query;

    if (!tags || typeof tags !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Tags parameter is required',
      });
    }

    const tagArray = tags.split(',').filter(Boolean);
    const result = await searchService.searchByTags(
      userId,
      tagArray,
      Number(limit),
      Number(offset)
    );

    res.json({
      success: true,
      data: {
        notes: result.notes,
        pagination: {
          total: result.total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < result.total,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Tag search error');
    res.status(500).json({
      success: false,
      error: 'Tag search failed',
    });
  }
});

// GET /api/v1/search/popular-tags - Get popular tags
router.get('/popular-tags', async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { limit = 20 } = req.query;

    const tags = await searchService.getPopularTags(userId, Number(limit));

    res.json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    logger.error({ error }, 'Popular tags error');
    res.status(500).json({
      success: false,
      error: 'Failed to get popular tags',
    });
  }
});

export { router as searchRouter };
export default router;
