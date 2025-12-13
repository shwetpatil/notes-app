import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { notesRouter } from "./routes/notes";
import templatesRouter from "./routes/templates";
import foldersRouter from "./routes/folders";
import sharesRouter from "./routes/shares";
import exportRouter from "./routes/export";
import { healthRouter } from "./routes/health";
import { metricsRouter } from "./routes/metrics";
import { errorHandler } from "./middleware/errorHandler";
import { performanceMonitoring } from "./middleware/monitoring";
import https from "https";
import http from "http";
import fs from "fs";

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
  PORT: parseInt(process.env.BACKEND_PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  SESSION_SECRET: process.env.SESSION_SECRET || "your-secret-key-change-this",
  ENABLE_HTTPS: process.env.ENABLE_HTTPS === "true",
  SSL_KEY_PATH: process.env.SSL_KEY_PATH,
  SSL_CERT_PATH: process.env.SSL_CERT_PATH,
  BODY_LIMIT: process.env.BODY_PARSER_LIMIT || "10mb",
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },
  CLUSTER_MODE: process.env.CLUSTER_MODE === "true",
  ENABLE_PERFORMANCE: process.env.ENABLE_PERFORMANCE_LOGGING === "true" || process.env.ENABLE_METRICS_COLLECTION === "true",
} as const;

const app: Express = express();

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
    origin: CONFIG.CORS_ORIGIN,
    credentials: true,
  })
);

// General rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.WINDOW_MS,
  max: CONFIG.RATE_LIMIT.MAX_REQUESTS,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing with limits
app.use(express.json({ limit: CONFIG.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: CONFIG.BODY_LIMIT }));

// Performance monitoring (must be after body parsers)
if (CONFIG.ENABLE_PERFORMANCE) {
  app.use(performanceMonitoring);
}

// Session configuration
app.use(
  session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: CONFIG.NODE_ENV === "production" || CONFIG.ENABLE_HTTPS,
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
app.use("/api/folders", foldersRouter);
app.use("/api/shares", sharesRouter);
app.use("/api/export", exportRouter);

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
if (!CONFIG.CLUSTER_MODE || require("cluster").isWorker) {
  let server: http.Server | https.Server;

  if (CONFIG.ENABLE_HTTPS && CONFIG.SSL_KEY_PATH && CONFIG.SSL_CERT_PATH) {
    // HTTPS Server
    try {
      const options = {
        key: fs.readFileSync(CONFIG.SSL_KEY_PATH),
        cert: fs.readFileSync(CONFIG.SSL_CERT_PATH),
      };
      server = https.createServer(options, app);
      server.listen(CONFIG.PORT, () => {
        const pid = process.pid;
        console.log(`🔒 HTTPS Backend server running on https://localhost:${CONFIG.PORT} (PID: ${pid})`);
        console.log(`📝 Environment: ${CONFIG.NODE_ENV}`);
        if (CONFIG.CLUSTER_MODE) {
          console.log(`👷 Worker process ${pid} ready`);
        }
      });
    } catch (error) {
      console.error("❌ Failed to start HTTPS server:", error);
      console.log("⚠️  Falling back to HTTP...");
      server = http.createServer(app);
      server.listen(CONFIG.PORT, () => {
        console.log(`⚡ HTTP Backend server running on http://localhost:${CONFIG.PORT}`);
      });
    }
  } else {
    // HTTP Server
    server = http.createServer(app);
    server.listen(CONFIG.PORT, () => {
      const pid = process.pid;
      console.log(`⚡ Backend server running on http://localhost:${CONFIG.PORT} (PID: ${pid})`);
      console.log(`📝 Environment: ${CONFIG.NODE_ENV}`);
      if (CONFIG.CLUSTER_MODE) {
        console.log(`👷 Worker process ${pid} ready`);
      }
    });
  }

  // Graceful shutdown
  if (!CONFIG.CLUSTER_MODE) {
    const gracefulShutdown = () => {
      console.log("\n🛑 Received shutdown signal, closing server gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  }
}

// Export app for testing
export { app };
export default app;
