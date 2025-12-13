/**
 * Validation Middleware
 * Reusable middleware for validating request data with Zod schemas
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../config";
import { HTTP_STATUS, ERROR_MESSAGES, LOG_EVENTS } from "../constants";

// ============================================================================
// Types
// ============================================================================

type ValidationTarget = 'body' | 'query' | 'params';

// ============================================================================
// Validation Middleware Factory
// ============================================================================

/**
 * Creates a validation middleware for a specific Zod schema
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, params)
 * @returns Express middleware function
 * 
 * @example
 * router.post('/notes', validate(createNoteSchema), handler);
 */
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[target];
      
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        
        logger.warn({
          event: LOG_EVENTS.VALIDATION_ERROR,
          target,
          errors,
          path: req.path,
          userId: req.session?.user?.id,
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_INPUT,
          details: errors,
        });
      }

      // Replace request data with validated data (strips unknown fields)
      req[target] = result.data;
      
      next();
    } catch (error) {
      logger.error({ err: error, target, path: req.path }, "Validation middleware error");
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  };
};

/**
 * Validates multiple targets in a single middleware
 * @param schemas - Object mapping targets to their schemas
 * 
 * @example
 * router.put('/notes/:id', 
 *   validateMultiple({
 *     params: noteIdSchema,
 *     body: updateNoteSchema
 *   }),
 *   handler
 * );
 */
export const validateMultiple = (
  schemas: Partial<Record<ValidationTarget, ZodSchema>>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const allErrors: Record<string, any> = {};
      let hasErrors = false;

      for (const [target, schema] of Object.entries(schemas)) {
        const result = schema.safeParse(req[target as ValidationTarget]);

        if (!result.success) {
          allErrors[target] = formatZodErrors(result.error);
          hasErrors = true;
        } else {
          // Replace with validated data
          req[target as ValidationTarget] = result.data;
        }
      }

      if (hasErrors) {
        logger.warn({
          event: LOG_EVENTS.VALIDATION_ERROR,
          errors: allErrors,
          path: req.path,
          userId: req.session?.user?.id,
        });

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: ERROR_MESSAGES.INVALID_INPUT,
          details: allErrors,
        });
      }

      next();
    } catch (error) {
      logger.error({ err: error, path: req.path }, "Multiple validation middleware error");
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  };
};

/**
 * Optional validation - passes through if data is empty
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate
 */
export const validateOptional = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[target];

    // If no data provided, skip validation
    if (!dataToValidate || Object.keys(dataToValidate).length === 0) {
      return next();
    }

    // Otherwise, use standard validation
    return validate(schema, target)(req, res, next);
  };
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Formats Zod validation errors into a more readable structure
 * @param error - ZodError object
 * @returns Formatted error object
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const message = err.message;

    if (!formatted[path]) {
      formatted[path] = [];
    }

    formatted[path].push(message);
  });

  return formatted;
}

/**
 * Extracts validation error messages into a flat array
 * @param error - ZodError object
 * @returns Array of error messages
 */
export function getValidationErrorMessages(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
}

// ============================================================================
// Common Validation Helpers
// ============================================================================

/**
 * Validates pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { page, pageSize } = req.query;

  if (page && isNaN(Number(page))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Page must be a number',
    });
  }

  if (pageSize && isNaN(Number(pageSize))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Page size must be a number',
    });
  }

  // Convert to numbers
  if (page) req.query.page = String(Math.max(1, Number(page)));
  if (pageSize) req.query.pageSize = String(Math.min(100, Math.max(1, Number(pageSize))));

  next();
};

/**
 * Validates sort parameters
 */
export const validateSort = (validFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { sortBy, order } = req.query;

    if (sortBy && !validFields.includes(sortBy as string)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Sort field must be one of: ${validFields.join(', ')}`,
      });
    }

    if (order && !['asc', 'desc'].includes(order as string)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Sort order must be "asc" or "desc"',
      });
    }

    next();
  };
};

/**
 * Validates that required query parameters are present
 */
export const requireQueryParams = (...params: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = params.filter(param => !req.query[param]);

    if (missing.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `Missing required query parameters: ${missing.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Validates array query parameters (comma-separated)
 */
export const validateArrayParam = (paramName: string, maxItems?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.query[paramName];

    if (!value) {
      return next();
    }

    if (typeof value !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `${paramName} must be a comma-separated string`,
      });
    }

    const items = value.split(',').map(item => item.trim()).filter(Boolean);

    if (maxItems && items.length > maxItems) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `${paramName} cannot have more than ${maxItems} items`,
      });
    }

    // Store parsed array
    (req.query as any)[`${paramName}Array`] = items;

    next();
  };
};

/**
 * Validates boolean query parameters
 */
export const validateBooleanParam = (...params: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const param of params) {
      const value = req.query[param];

      if (value && !['true', 'false', '1', '0'].includes(value as string)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: `${param} must be a boolean value (true/false)`,
        });
      }

      // Convert to actual boolean
      if (value) {
        (req.query as any)[param] = value === 'true' || value === '1';
      }
    }

    next();
  };
};

/**
 * Validates file size in multipart requests
 */
export const validateFileSize = (maxSizeMB: number) => {
  const maxBytes = maxSizeMB * 1024 * 1024;

  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: `File size cannot exceed ${maxSizeMB}MB`,
      });
    }

    next();
  };
};
