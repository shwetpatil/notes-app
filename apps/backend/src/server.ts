import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";
import templatesRouter from "./routes/templates";
import { healthRouter } from "./routes/health";
import { metricsRouter } from "./routes/metrics";
import { errorHandler } from "./middleware/errorHandler";
import { performanceMonitoring } from "./middleware/monitoring";

dotenv.config();

const app: Express = express();
const PORT = process.env.BACKEND_PORT || 3001;

// ============================================================================
// Middleware
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring (must be after body parsers)
if (process.env.ENABLE_PERFORMANCE_LOGGING === "true" || process.env.ENABLE_METRICS_COLLECTION === "true") {
  app.use(performanceMonitoring);
}

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Don't use default 'connect.sid'
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ============================================================================
// Routes
// ============================================================================

app.use("/api/health", healthRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/templates", templatesRouter);

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

// Only start server if not in cluster mode or if we're a worker
if (!process.env.CLUSTER_MODE || require("cluster").isWorker) {
  app.listen(PORT, () => {
    const pid = process.pid;
    console.log(`✨ Backend server running on http://localhost:${PORT} (PID: ${pid})`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    
    if (process.env.CLUSTER_MODE === "true") {
      console.log(`👷 Worker process ${pid} ready`);
    }
  });

  // Graceful shutdown for single instance mode
  if (!process.env.CLUSTER_MODE) {
    const gracefulShutdown = () => {
      console.log("\n🛑 Received shutdown signal, closing server gracefully...");
      process.exit(0);
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  }
}

// Export app for testing
export { app };
export default app;
