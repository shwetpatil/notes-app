-- CreateIndex for Full-Text Search
-- Add GIN index for full-text search on notes

-- Create tsvector column for search (optional but improves performance)
-- We'll use functional indexes instead to avoid adding a column

-- GIN index on title
CREATE INDEX IF NOT EXISTS "Note_title_gin_idx" ON "Note" USING GIN (to_tsvector('english', title));

-- GIN index on content  
CREATE INDEX IF NOT EXISTS "Note_content_gin_idx" ON "Note" USING GIN (to_tsvector('english', content));

-- GIN index on tags (array search)
CREATE INDEX IF NOT EXISTS "Note_tags_gin_idx" ON "Note" USING GIN (tags);

-- Composite GIN index for combined search (title + content + tags)
CREATE INDEX IF NOT EXISTS "Note_search_gin_idx" ON "Note" USING GIN (
  (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'C')
  )
);

-- Index for userId filtering with full-text search
CREATE INDEX IF NOT EXISTS "Note_userId_isDeleted_idx" ON "Note" ("userId", "isDeleted");
