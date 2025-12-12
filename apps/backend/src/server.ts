import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// ============================================================================
// Middleware
// ============================================================================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    // Optional: Redis store can be enabled here
    // store: RedisStore configuration
  })
);

// ============================================================================
// Routes
// ============================================================================

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

// ============================================================================
// Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`✨ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
