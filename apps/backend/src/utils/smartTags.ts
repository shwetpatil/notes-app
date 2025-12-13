/**
 * Smart tag suggestion utility
 * Extracts keywords and suggests tags based on note content
 */

interface TagSuggestion {
  tag: string;
  score: number;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "if",
  "in",
  "into",
  "is",
  "it",
  "no",
  "not",
  "of",
  "on",
  "or",
  "such",
  "that",
  "the",
  "their",
  "then",
  "there",
  "these",
  "they",
  "this",
  "to",
  "was",
  "will",
  "with",
]);

// Common programming/tech keywords that make good tags
const TECH_KEYWORDS = new Set([
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "vue",
  "angular",
  "node",
  "express",
  "database",
  "sql",
  "mongodb",
  "postgresql",
  "api",
  "rest",
  "graphql",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "testing",
  "debugging",
  "deployment",
  "security",
  "performance",
  "frontend",
  "backend",
  "fullstack",
  "devops",
  "ci/cd",
  "git",
  "github",
  "linux",
  "windows",
  "macos",
  "mobile",
  "ios",
  "android",
  "web",
  "machine learning",
  "ai",
  "artificial intelligence",
  "data science",
  "algorithm",
  "architecture",
  "design pattern",
  "refactoring",
  "code review",
]);

/**
 * Extracts and normalizes words from text for analysis
 * Converts to lowercase, removes punctuation (except hyphens), and filters out stop words
 * 
 * @param text - The input text to extract words from
 * @returns Array of normalized words longer than 2 characters, excluding stop words
 * 
 * @example
 * extractWords("Hello World! This is a test.")
 * // Returns: ["hello", "world", "test"]
 */
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ") // Remove punctuation except hyphens
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Calculates the frequency of each word in an array
 * 
 * @param words - Array of words to count
 * @returns Map with words as keys and their occurrence count as values
 * 
 * @example
 * calculateFrequency(["hello", "world", "hello"])
 * // Returns: Map { "hello" => 2, "world" => 1 }
 */
function calculateFrequency(words: string[]): Map<string, number> {
  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  return frequency;
}

/**
 * Extracts technical/programming keywords from text
 * Searches for predefined tech terms (e.g., javascript, docker, aws)
 * 
 * @param text - The input text to search for technical keywords
 * @returns Set of found technical keywords in lowercase
 * 
 * @example
 * extractTechKeywords("Building a React app with Docker")
 * // Returns: Set { "react", "docker" }
 */
function extractTechKeywords(text: string): Set<string> {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const keyword of TECH_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      found.add(keyword);
    }
  }

  return found;
}

/**
 * Extracts hashtags from text using regex pattern matching
 * Matches #word or #word-with-hyphens format
 * 
 * @param text - The input text containing hashtags
 * @returns Array of hashtags without the # symbol, in lowercase
 * 
 * @example
 * extractHashtags("Check out #javascript and #node-js tutorials")
 * // Returns: ["javascript", "node-js"]
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w-]+/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.map((tag) => tag.substring(1).toLowerCase());
}

/**
 * Generates intelligent tag suggestions based on note title and content
 * Uses multi-source analysis with weighted scoring:
 * - Hashtags (score: 10) - highest priority
 * - Technical keywords (score: 8) - programming/tech terms
 * - Title words (score: 6-9) - weighted by frequency
 * - Content frequency (score: 2-5) - words appearing 2+ times
 * - Capitalized words (score: 4) - potential proper nouns
 * 
 * @param title - The note title to analyze
 * @param content - The note content to analyze
 * @param existingTags - Tags already applied to the note (excluded from suggestions)
 * @param maxSuggestions - Maximum number of tag suggestions to return (default: 5)
 * @returns Array of suggested tags, sorted by relevance score
 * 
 * @example
 * suggestTags(
 *   "Building React Apps",
 *   "Learn how to build React apps with #javascript and #react. React is powerful.",
 *   ["tutorial"],
 *   3
 * )
 * // Returns: ["javascript", "react", "building"]
 */
export function suggestTags(
  title: string,
  content: string,
  existingTags: string[] = [],
  maxSuggestions: number = 5
): string[] {
  const suggestions: TagSuggestion[] = [];

  // 1. Extract hashtags (highest priority)
  const hashtags = extractHashtags(content);
  for (const tag of hashtags) {
    if (!existingTags.includes(tag)) {
      suggestions.push({ tag, score: 10 });
    }
  }

  // 2. Extract technical keywords (high priority)
  const techKeywords = extractTechKeywords(title + " " + content);
  for (const keyword of techKeywords) {
    if (!existingTags.includes(keyword)) {
      suggestions.push({ tag: keyword, score: 8 });
    }
  }

  // 3. Extract frequent words from title (title words have higher weight)
  const titleWords = extractWords(title);
  const titleFrequency = calculateFrequency(titleWords);

  for (const [word, freq] of titleFrequency.entries()) {
    if (!existingTags.includes(word) && word.length > 3) {
      suggestions.push({ tag: word, score: 6 + Math.min(freq, 3) });
    }
  }

  // 4. Extract frequent words from content
  const contentWords = extractWords(content);
  const contentFrequency = calculateFrequency(contentWords);

  // Get top frequent words
  const sortedWords = Array.from(contentFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  for (const [word, freq] of sortedWords) {
    if (
      !existingTags.includes(word) &&
      word.length > 3 &&
      !suggestions.find((s) => s.tag === word)
    ) {
      const score = Math.min(freq, 5);
      if (score >= 2) {
        // Only suggest words that appear at least twice
        suggestions.push({ tag: word, score });
      }
    }
  }

  // 5. Extract capitalized words (potential proper nouns)
  const capitalizedRegex = /\b[A-Z][a-z]{2,}\b/g;
  const capitalizedWords = (title + " " + content).match(capitalizedRegex) || [];
  const uniqueCapitalized = [...new Set(capitalizedWords.map((w) => w.toLowerCase()))];

  for (const word of uniqueCapitalized) {
    if (
      !existingTags.includes(word) &&
      !suggestions.find((s) => s.tag === word) &&
      word.length > 3
    ) {
      suggestions.push({ tag: word, score: 4 });
    }
  }

  // Sort by score and return top suggestions
  const sortedSuggestions = suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map((s) => s.tag);

  return sortedSuggestions;
}

/**
 * Suggests related tags based on user's tag usage patterns
 * Analyzes frequency of tags across all user notes to suggest commonly used tags
 * 
 * Note: This is a basic frequency-based implementation that could be enhanced
 * with co-occurrence analysis (tags frequently used together)
 * 
 * @param userTags - Tags already applied to the current note
 * @param allUserTags - All tags from all user notes (can include duplicates)
 * @param maxSuggestions - Maximum number of related tags to suggest (default: 3)
 * @returns Array of related tag suggestions, sorted by frequency
 * 
 * @example
 * getRelatedTags(
 *   ["javascript"],
 *   ["typescript", "node", "typescript", "react"],
 *   2
 * )
 * // Returns: ["typescript", "node"] (most frequent, excluding "javascript")
 */
export function getRelatedTags(
  userTags: string[],
  allUserTags: string[],
  maxSuggestions: number = 3
): string[] {
  // Simple co-occurrence: if user often uses tags together, suggest them
  // This is a basic implementation - could be enhanced with actual co-occurrence analysis

  const tagSet = new Set(userTags);
  const related: string[] = [];

  // Count tag frequency
  const frequency = new Map<string, number>();
  for (const tag of allUserTags) {
    if (!tagSet.has(tag)) {
      frequency.set(tag, (frequency.get(tag) || 0) + 1);
    }
  }

  // Sort by frequency and return top
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSuggestions)
    .map(([tag]) => tag);

  return sorted;
}

/**
 * Validates and normalizes tags to ensure consistent formatting
 * Operations performed:
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes special characters (except hyphens)
 * - Replaces spaces with hyphens
 * - Filters tags between 2-30 characters
 * - Removes duplicates
 * 
 * @param tags - Array of raw tag strings to normalize
 * @returns Array of normalized, valid tags without duplicates
 * 
 * @example
 * normalizeTags(["JavaScript", "Node.js", "Node JS", "a", "JavaScript"])
 * // Returns: ["javascript", "node-js", "node-js"] -> ["javascript", "node-js"]
 */
export function normalizeTags(tags: string[]): string[] {
  return tags
    .map((tag) =>
      tag
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special chars except hyphens
        .replace(/\s+/g, "-") // Convert spaces to hyphens
    )
    .filter((tag) => tag.length > 1 && tag.length <= 30) // Filter length
    .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
}
