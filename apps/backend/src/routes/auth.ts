import { Router, Request, Response } from "express";
import { loginSchema } from "@notes/types";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import validator from "validator";

const router: Router = Router();

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Register new user
router.post("/register", authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input format",
      });
    }

    const { email, password } = parsed.data;

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Registration failed", // Generic message to prevent email enumeration
      });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user with hashed password
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
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
router.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input format",
      });
    }

    const { email, password, rememberMe } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generic error message to prevent email enumeration
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        error: `Account locked. Try again in ${remainingTime} minute${remainingTime !== 1 ? 's' : ''}.`,
      });
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const updatedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = updatedAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: updatedAttempts,
          accountLockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_TIME)
            : null,
        },
      });

      if (shouldLock) {
        return res.status(423).json({
          success: false,
          error: "Account locked due to too many failed login attempts. Try again in 15 minutes.",
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Reset failed attempts and update last login on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Set session with extended duration if rememberMe is true
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Extend session duration for "Remember Me"
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

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
      error: "Authentication failed",
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
