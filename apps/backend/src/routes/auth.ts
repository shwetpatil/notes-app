import { Router, Request, Response } from "express";
import { loginSchema } from "@notes/types";
import { prisma } from "../lib/prisma";

const router = Router();

// Register new user
router.post("/register", async (req: Request, res: Response) => {
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User already exists",
      });
    }

    // Create new user (in production, hash the password!)
    const user = await prisma.user.create({
      data: {
        email,
        password, // In production, use bcrypt.hash()
        name: email.split("@")[0],
      },
    });

    // Set session
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: "Account created successfully",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register",
    });
  }
});

// Login - authenticate existing user
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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check password (in production, use bcrypt.compare())
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
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
