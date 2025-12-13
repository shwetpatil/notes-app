import { Request, Response, NextFunction } from "express";
import { logger } from "../config";

/**
 * Global error handling middleware for Express application
 * Catches unhandled errors and returns appropriate error responses
 * 
 * @middleware
 * @param {Error} err - Error object thrown or passed to next()
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} Sends 500 error response with error details
 * 
 * Behavior:
 * - Logs all errors to console for debugging
 * - In development: Returns full error message to client
 * - In production: Returns generic "Internal server error" message (security)
 * 
 * @example
 * // Use as last middleware in Express app:
 * app.use(routes);
 * app.use(errorHandler); // Must be after all other middleware/routes
 * 
 * @example
 * // Trigger from any route:
 * router.get('/example', async (req, res, next) => {
 *   try {
 *     // ... code that might throw
 *   } catch (error) {
 *     next(error); // Passes to errorHandler
 *   }
 * });
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({ 
    err, 
    method: req.method, 
    path: req.path, 
    ip: req.ip 
  }, "Unhandled error");

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
};
