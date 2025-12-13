import { prisma } from '../config/database.config';
import { logger } from '../config/logger.config';
import { Prisma } from '@prisma/client';

export interface SearchOptions {
  query: string;
  userId: string;
  limit?: number;
  offset?: number;
  includeShared?: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  rank: number;
  headline?: string;
}

export class SearchService {
  /**
   * Full-text search using PostgreSQL tsvector
   */
  async searchNotes(options: SearchOptions): Promise<{ notes: SearchResult[]; total: number }> {
    const { query, userId, limit = 20, offset = 0, includeShared = true } = options;

    try {
      // Prepare search query
      const searchQuery = query
        .trim()
        .split(/\s+/)
        .map((term) => `${term}:*`)
        .join(' & ');

      // Build WHERE clause for ownership/sharing
      const accessConditions = Prisma.sql`
        ("Note"."userId" = ${userId}
        ${
          includeShared
            ? Prisma.sql`OR EXISTS (
                SELECT 1 FROM "NoteShare" 
                WHERE "NoteShare"."noteId" = "Note"."id" 
                AND "NoteShare"."sharedWithUserId" = ${userId}
              )`
            : Prisma.empty
        })
      `;

      // Execute full-text search with ranking
      const notes = await prisma.$queryRaw<SearchResult[]>`
        SELECT 
          "Note"."id",
          "Note"."title",
          "Note"."content",
          "Note"."tags",
          "Note"."folderId",
          "Note"."createdAt",
          "Note"."updatedAt",
          ts_rank(
            setweight(to_tsvector('english', COALESCE("Note"."title", '')), 'A') ||
            setweight(to_tsvector('english', COALESCE("Note"."content", '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(array_to_string("Note"."tags", ' '), '')), 'C'),
            to_tsquery('english', ${searchQuery})
          ) as rank,
          ts_headline('english', 
            COALESCE("Note"."content", ''), 
            to_tsquery('english', ${searchQuery}),
            'MaxWords=50, MinWords=25, ShortWord=3, HighlightAll=FALSE, MaxFragments=2'
          ) as headline
        FROM "Note"
        WHERE 
          "Note"."isTrashed" = false
          AND ${accessConditions}
          AND (
            to_tsvector('english', COALESCE("Note"."title", '')) ||
            to_tsvector('english', COALESCE("Note"."content", '')) ||
            to_tsvector('english', COALESCE(array_to_string("Note"."tags", ' '), ''))
          ) @@ to_tsquery('english', ${searchQuery})
        ORDER BY rank DESC, "Note"."updatedAt" DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      // Get total count
      const totalResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "Note"
        WHERE 
          "Note"."isTrashed" = false
          AND ${accessConditions}
          AND (
            to_tsvector('english', COALESCE("Note"."title", '')) ||
            to_tsvector('english', COALESCE("Note"."content", '')) ||
            to_tsvector('english', COALESCE(array_to_string("Note"."tags", ' '), ''))
          ) @@ to_tsquery('english', ${searchQuery})
      `;

      const total = Number(totalResult[0].count);

      logger.info({ query, userId, resultsCount: notes.length, total }, 'Full-text search executed');

      return { notes, total };
    } catch (error) {
      logger.error({ error, query, userId }, 'Full-text search error');
      throw new Error('Search failed');
    }
  }

  /**
   * Search with autocomplete suggestions
   */
  async getSuggestions(userId: string, prefix: string, limit: number = 10): Promise<string[]> {
    try {
      const notes = await prisma.note.findMany({
        where: {
          userId,
          isTrashed: false,
          OR: [
            { title: { startsWith: prefix, mode: 'insensitive' } },
            { tags: { hasSome: [prefix] } },
          ],
        },
        select: {
          title: true,
          tags: true,
        },
        take: limit,
      });

      const suggestions = new Set<string>();
      
      notes.forEach((note: { title: string; tags: string[] }) => {
        if (note.title.toLowerCase().startsWith(prefix.toLowerCase())) {
          suggestions.add(note.title);
        }
        note.tags.forEach((tag: string) => {
          if (tag.toLowerCase().startsWith(prefix.toLowerCase())) {
            suggestions.add(tag);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      logger.error({ error, userId, prefix }, 'Suggestions error');
      return [];
    }
  }

  /**
   * Search by tags with FTS
   */
  async searchByTags(
    userId: string,
    tags: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notes: any[]; total: number }> {
    try {
      const notes = await prisma.note.findMany({
        where: {
          userId,
          isTrashed: false,
          tags: {
            hasSome: tags,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.note.count({
        where: {
          userId,
          isTrashed: false,
          tags: {
            hasSome: tags,
          },
        },
      });

      return { notes, total };
    } catch (error) {
      logger.error({ error, userId, tags }, 'Tag search error');
      throw new Error('Tag search failed');
    }
  }

  /**
   * Get popular tags for user
   */
  async getPopularTags(userId: string, limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    try {
      const result = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM "Note"
        WHERE "userId" = ${userId} AND "isTrashed" = false
        GROUP BY tag
        ORDER BY count DESC
        LIMIT ${limit}
      `;

      return result.map((row: { tag: string; count: bigint }) => ({
        tag: row.tag,
        count: Number(row.count),
      }));
    } catch (error) {
      logger.error({ error, userId }, 'Popular tags error');
      return [];
    }
  }
}

export const searchService = new SearchService();
export default searchService;
