import { Request, Response, NextFunction } from "express";
import xss from "xss";

/**
 * Middleware to sanitize user input and prevent XSS attacks
 * Cleans HTML and dangerous characters from request body
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === "string") {
    return xss(obj, {
      whiteList: {}, // No HTML tags allowed by default
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script", "style"],
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Specific sanitizer for markdown content
 * Allows safe markdown but strips dangerous HTML
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
