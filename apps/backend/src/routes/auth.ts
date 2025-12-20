import { Router, Request, Response } from "express";
import { loginSchema } from "@notes/types";
import { prisma } from "../config";
import bcrypt from "bcrypt";
import validator from "validator";
import { authRateLimiter } from "../middleware/rateLimiter";
import { AUTH_CONSTANTS } from "../constants";

const router: Router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     message:
 *                       type: string
 *                       example: Account created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post("/register", authRateLimiter, async (req: Request, res: Response) => {
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
    const hashedPassword = await bcrypt.hash(password, AUTH_CONSTANTS.SALT_ROUNDS);

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
    logger.error({ error }, 'Register error');
    res.status(500).json({
      success: false,
      error: "Failed to register",
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       423:
 *         description: Account locked
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post("/login", authRateLimiter, async (req: Request, res: Response) => {
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
      const shouldLock = updatedAttempts >= AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: updatedAttempts,
          accountLockedUntil: shouldLock
            ? new Date(Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION)
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
    logger.error({ error }, 'Login error');
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
