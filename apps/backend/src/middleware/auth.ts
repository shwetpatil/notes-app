import { Request, Response, NextFunction } from "express";
import { SessionUser } from "@notes/types";

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }
  next();
};
