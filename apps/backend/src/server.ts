import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
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
import {
  serverConfig,
  securityConfig,
  clusterConfig,
  monitoringConfig,
  appConfig,
} from "./config";

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
    origin: serverConfig.corsOrigin,
    credentials: true,
  })
);

// General rate limiting
const limiter = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.maxRequests,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing with limits
app.use(express.json({ limit: serverConfig.bodyParserLimit }));
app.use(express.urlencoded({ extended: true, limit: serverConfig.bodyParserLimit }));

// Performance monitoring (must be after body parsers)
if (monitoringConfig.enabled) {
  app.use(performanceMonitoring);
}

// Session configuration
app.use(
  session({
    secret: securityConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: appConfig.isProduction || serverConfig.https.enabled,
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
if (!clusterConfig.enabled || require("cluster").isWorker) {
  let server: http.Server | https.Server;

  if (serverConfig.https.enabled && serverConfig.https.keyPath && serverConfig.https.certPath) {
    // HTTPS Server
    try {
      const options = {
        key: fs.readFileSync(serverConfig.https.keyPath),
        cert: fs.readFileSync(serverConfig.https.certPath),
      };
      server = https.createServer(options, app);
      server.listen(serverConfig.port, () => {
        const pid = process.pid;
        console.log(`🔒 HTTPS Backend server running on https://localhost:${serverConfig.port} (PID: ${pid})`);
        console.log(`📝 Environment: ${appConfig.nodeEnv}`);
        if (clusterConfig.enabled) {
          console.log(`👷 Worker process ${pid} ready`);
        }
      });
    } catch (error) {
      console.error("❌ Failed to start HTTPS server:", error);
      console.log("⚠️  Falling back to HTTP...");
      server = http.createServer(app);
      server.listen(serverConfig.port, () => {
        console.log(`⚡ HTTP Backend server running on http://localhost:${serverConfig.port}`);
      });
    }
  } else {
    // HTTP Server
    server = http.createServer(app);
    server.listen(serverConfig.port, () => {
      const pid = process.pid;
      console.log(`⚡ Backend server running on http://localhost:${serverConfig.port} (PID: ${pid})`);
      console.log(`📝 Environment: ${appConfig.nodeEnv}`);
      if (clusterConfig.enabled) {
        console.log(`👷 Worker process ${pid} ready`);
      }
    });
  }

  // Graceful shutdown
  if (!clusterConfig.enabled) {
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
