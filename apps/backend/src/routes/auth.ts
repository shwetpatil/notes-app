import { Router, Request, Response } from "express";
import { loginSchema } from "@notes/types";
import { prisma } from "../lib/prisma";

const router = Router();

// Stub login - in production, use proper password hashing (bcrypt)
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        details: parsed.error.issues,
      });
    }

    const { email, password } = parsed.data;

    // Find or create user (stub auth)
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-create user for demo purposes
      user = await prisma.user.create({
        data: {
          email,
          password, // In production, hash this!
          name: email.split("@")[0],
        },
      });
    }

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: "Logged in successfully",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to logout",
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
});

router.get("/me", (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
  }

  res.json({
    success: true,
    data: {
      user: req.session.user,
    },
  });
});

export { router as authRouter };
