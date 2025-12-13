import { Request, Response, NextFunction } from "express";
import { SessionUser } from "@notes/types";

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies that user session exists before allowing access to protected endpoints
 * 
 * @middleware
 * @param {Request} req - Express request object with session data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {void} Calls next() if authenticated, sends 401 error if not
 * 
 * @example
 * // Protect a route:
 * router.get('/protected', requireAuth, async (req, res) => {
 *   // req.session.user is guaranteed to exist here
 *   const userId = req.session.user.id;
 * });
 * 
 * @example
 * // Protect all routes in a router:
 * router.use(requireAuth);
 * router.get('/', handler1);
 * router.post('/', handler2);
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }
  next();
};
