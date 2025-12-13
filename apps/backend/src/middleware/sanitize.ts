import xss from "xss";

/**
 * Sanitize markdown content - allows safe HTML tags used in markdown
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
 * Sanitize HTML/rich text from TipTap editor - whitelist safe tags only
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
