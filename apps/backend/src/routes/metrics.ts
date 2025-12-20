import { Router, Request, Response } from "express";
import { getAggregatedMetrics, resetMetrics } from "../middleware/monitoring";
import os from "os";

const router: Router = Router();

/**
 * GET /api/metrics - Get aggregated performance metrics
 */
router.get("/", (req: Request, res: Response) => {
  const metrics = getAggregatedMetrics();

  if (!metrics) {
    return res.json({
      message: "No metrics available yet",
      enabled: process.env.ENABLE_METRICS_COLLECTION === "true",
    });
  }

  res.json(metrics);
});

/**
 * GET /api/metrics/system - Get system metrics
 */
router.get("/system", (req: Request, res: Response) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryPercentage = (usedMem / totalMem) * 100;

  const cpus = os.cpus();
  const loadAverage = os.loadavg();

  res.json({
    memory: {
      total: Math.round(totalMem / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      percentage: Math.round(memoryPercentage),
    },
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || "Unknown",
      loadAverage: {
        "1min": Math.round(loadAverage[0] * 100) / 100,
        "5min": Math.round(loadAverage[1] * 100) / 100,
        "15min": Math.round(loadAverage[2] * 100) / 100,
      },
    },
    process: {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    },
    timestamp: Date.now(),
  });
});

/**
 * POST /api/metrics/reset - Reset metrics (admin only)
 */
router.post("/reset", (req: Request, res: Response) => {
  resetMetrics();
  res.json({ message: "Metrics reset successfully" });
});

/**
 * POST /api/metrics/vitals - Receive Core Web Vitals from frontend
 */
router.post("/vitals", (req: Request, res: Response) => {
  const { name, value, rating, id, navigationType } = req.body;

  if (process.env.ENABLE_WEB_VITALS_LOGGING === "true") {
    logger.info(
      { metric: name, value: Math.round(value), rating, navigationType: navigationType || "navigation" },
      `🎯 Web Vital: ${name}`
    );
  }

  // In production, send to monitoring service (DataDog, New Relic, etc.)
  // Example: sendToMonitoringService({ name, value, rating, id, navigationType });

  res.status(201).json({ received: true });
});

export { router as metricsRouter };
