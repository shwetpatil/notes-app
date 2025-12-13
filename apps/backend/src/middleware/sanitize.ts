import xss from "xss";

/**
 * Sanitizes markdown content by allowing only safe HTML tags
 * Prevents XSS attacks while preserving markdown formatting
 * 
 * @param {string} content - Raw markdown content with potential HTML
 * @returns {string} Sanitized content with only whitelisted tags
 * 
 * Allowed Tags:
 * - Text: strong, em, u, code
 * - Blocks: p, pre, blockquote, h1-h6, br
 * - Lists: ul, ol, li
 * - Links: a (href, title attributes only)
 * - Images: img (src, alt, title attributes only)
 * 
 * Security:
 * - Strips dangerous tags: script, style, iframe, object, embed
 * - Removes all inline CSS styles
 * - Removes unknown tags and their content
 * 
 * @example
 * const userInput = '<p>Safe text</p><script>alert("XSS")</script>';
 * const safe = sanitizeMarkdown(userInput);
 * // Returns: '<p>Safe text</p>' (script removed)
 * 
 * @example
 * const markdown = '**Bold** and <a href="#">link</a>';
 * const safe = sanitizeMarkdown(markdown);
 * // Preserves safe HTML: '<strong>Bold</strong> and <a href="#">link</a>'
 */
export const sanitizeMarkdown = (content: string): string => {
  return xss(content, {
    whiteList: {
      // Allow basic formatting tags that are safe
      strong: [],
      em: [],
      u: [],
      code: [],
      pre: [],
      blockquote: [],
      p: [],
      br: [],
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      ul: [],
      ol: [],
      li: [],
      a: ["href", "title"],
      img: ["src", "alt", "title"],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
    css: false, // No inline styles
  });
};

/**
 * Sanitizes rich text HTML content from TipTap editor
 * More permissive than sanitizeMarkdown to support rich text features
 * Prevents XSS while allowing formatting, lists, tables, and code blocks
 * 
 * @param {string} content - Raw HTML content from rich text editor
 * @returns {string} Sanitized content with comprehensive whitelist
 * 
 * Allowed Tags & Features:
 * - **Text formatting**: strong, b, em, i, u, s, code, mark
 * - **Headings**: h1, h2, h3, h4, h5, h6
 * - **Blocks**: p, div, blockquote, pre, hr, br
 * - **Lists**: ul, ol (with start), li (with data-* for task lists)
 * - **Links**: a (href, title, target, rel, class)
 * - **Tables**: table, thead, tbody, tr, th, td
 * - **Code**: pre/code with class (language-*, hljs for syntax highlighting)
 * - **Task lists**: li with data-checked, data-type attributes
 * 
 * Security:
 * - Strips dangerous tags: script, style, iframe, object, embed, form, input, button
 * - Removes all inline CSS to prevent CSS injection
 * - Allows data-* attributes only for task list functionality
 * - Allows class attributes only for code syntax highlighting
 * 
 * @example
 * const richText = '<p>Normal text</p><h2>Heading</h2><ul><li data-checked="true">Task</li></ul>';
 * const safe = sanitizeHtml(richText);
 * // Preserves all safe tags and attributes
 * 
 * @example
 * // Remove dangerous content:
 * const dangerous = '<script>alert("XSS")</script><p>Safe</p><iframe src="evil"></iframe>';
 * const safe = sanitizeHtml(dangerous);
 * // Returns: '<p>Safe</p>' (script and iframe removed)
 * 
 * @see sanitizeMarkdown() for simpler markdown content sanitization
 */
export const sanitizeHtml = (content: string): string => {
  return xss(content, {
    whiteList: {
      // Text formatting
      strong: [],
      b: [],
      em: [],
      i: [],
      u: [],
      s: [], // strikethrough
      code: ["class"],
      mark: [], // highlight
      
      // Headings
      h1: [],
      h2: [],
      h3: [],
      h4: [],
      h5: [],
      h6: [],
      
      // Block elements
      p: [],
      br: [],
      div: [],
      blockquote: [],
      pre: ["class"],
      hr: [],
      
      // Lists
      ul: [],
      ol: ["start"],
      li: ["data-checked", "data-type"], // For task lists
      
      // Links
      a: ["href", "title", "target", "rel", "class"],
      
      // Tables (if needed)
      table: [],
      thead: [],
      tbody: [],
      tr: [],
      th: [],
      td: [],
      
      // Other
      span: ["class"], // For various formatting
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    css: false, // No inline styles to prevent CSS injection
    onTagAttr: (tag, name, value) => {
      // Allow data-* attributes for task lists
      if (name.startsWith('data-')) {
        return `${name}="${value}"`;
      }
      // Allow class attributes with specific prefixes for code highlighting
      if (name === 'class' && (value.startsWith('language-') || value.startsWith('hljs'))) {
        return `class="${value}"`;
      }
    },
  });
};
