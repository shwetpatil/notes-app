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
import { searchRouter } from "./routes/search";
import v1Router from "./routes/v1";
import { errorHandler } from "./middleware/errorHandler";
import { performanceMonitoring } from "./middleware/monitoring";
import { redisClient } from "./config/redis";
import { initializeWebSocket } from "./config/websocket";
import { initializeSentry, getSentryMiddleware } from "./config/sentry";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import https from "https";
import http from "http";
import fs from "fs";
import {
  serverConfig,
  securityConfig,
  clusterConfig,
  monitoringConfig,
  appConfig,
  logger,
} from "./config";

const app: Express = express();

// ============================================================================
// Error Tracking (Sentry) - Must be first
// ============================================================================

initializeSentry(app);
const sentryMiddleware = getSentryMiddleware();
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);

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
// API Documentation (Swagger)
// ============================================================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Notes API Documentation',
}));

// Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================================================
// Routes
// ============================================================================

// Health and metrics (no versioning)
app.use("/api/health", healthRouter);
app.use("/api/metrics", metricsRouter);

// API v1 routes (versioned)
app.use("/api/v1", v1Router);

// Legacy routes (backward compatibility - redirect to v1)
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/folders", foldersRouter);
// app.use("/api/shares", sharesRouter);
app.use("/api/export", exportRouter);
app.use("/api/search", searchRouter);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Sentry error handler (must be before other error handlers)
app.use(sentryMiddleware.errorHandler);

// Custom error handler
app.use(errorHandler);

// ============================================================================
// Server
// ============================================================================

// Only start server if not in cluster mode or if we're a worker
if (!clusterConfig.enabled || require("cluster").isWorker) {
  let server: http.Server | https.Server;

  // Initialize Redis
  redisClient.connect().catch((error) => {
    logger.warn({ error }, '⚠️  Redis connection failed - running without cache');
  });

  if (serverConfig.https.enabled && serverConfig.https.keyPath && serverConfig.https.certPath) {
    // HTTPS Server
    try {
      const options = {
        key: fs.readFileSync(serverConfig.https.keyPath),
        cert: fs.readFileSync(serverConfig.https.certPath),
      };
      server = https.createServer(options, app);
      
      // Initialize WebSocket
      initializeWebSocket(server);
      
      server.listen(serverConfig.port, () => {
        const pid = process.pid;
        logger.info({ port: serverConfig.port, pid, protocol: 'https' }, '🔒 HTTPS Backend server running');
        logger.info({ environment: appConfig.nodeEnv }, '📝 Environment');
        logger.info('🔌 WebSocket server initialized');
        if (clusterConfig.enabled) {
          logger.info({ pid }, '👷 Worker process ready');
        }
      });
    } catch (error) {
      logger.error({ err: error }, "❌ Failed to start HTTPS server");
      logger.warn("⚠️  Falling back to HTTP...");
      server = http.createServer(app);
      
      // Initialize WebSocket
      initializeWebSocket(server);
      
      server.listen(serverConfig.port, () => {
        logger.info({ port: serverConfig.port, protocol: 'http' }, '⚡ HTTP Backend server running');
        logger.info('🔌 WebSocket server initialized');
      });
    }
  } else {
    // HTTP Server
    server = http.createServer(app);
    
    // Initialize WebSocket
    initializeWebSocket(server);
    
    server.listen(serverConfig.port, () => {
      const pid = process.pid;
      logger.info({ port: serverConfig.port, pid, protocol: 'http' }, '⚡ Backend server running');
      logger.info({ environment: appConfig.nodeEnv }, '📝 Environment');
      logger.info('🔌 WebSocket server initialized');
      if (clusterConfig.enabled) {
        logger.info({ pid }, '👷 Worker process ready');
      }
    });
  }

  // Graceful shutdown
  if (!clusterConfig.enabled) {
    const gracefulShutdown = async () => {
      logger.info("🛑 Received shutdown signal, closing server gracefully...");
      
      // Close Redis connection
      await redisClient.disconnect();
      
      server.close(() => {
        logger.info("✅ Server closed");
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
