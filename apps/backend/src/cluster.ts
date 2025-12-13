import cluster from "cluster";
import { clusterConfig, logger } from "./config";

const workers = Math.min(clusterConfig.maxWorkers, clusterConfig.numCPUs);

/**
 * Start the application in cluster mode to utilize all available CPU cores
 * This enables vertical scaling by allowing Node.js to utilize multiple cores
 */
export function startCluster() {
  if (cluster.isPrimary) {
    logger.info({ workers, cpus: clusterConfig.numCPUs }, '🚀 Starting cluster');
    logger.info({ pid: process.pid }, '📊 Master process running');

    // Track worker restarts to prevent restart loops
    const restartCounts = new Map<number, number>();
    const RESTART_THRESHOLD = 5;
    const RESTART_WINDOW = 60000; // 1 minute

    // Fork workers
    for (let i = 0; i < workers; i++) {
      const worker = cluster.fork();
      logger.info({ pid: worker.process.pid, workerId: worker.id }, '✅ Worker started');
    }

    // Handle worker exit and restart
    cluster.on("exit", (worker, code, signal) => {
      const pid = worker.process.pid;
      logger.warn({ pid, code, signal, workerId: worker.id }, '⚠️  Worker died');

      // Track restart count
      const now = Date.now();
      const workerRestarts = restartCounts.get(worker.id) || 0;
      
      if (workerRestarts >= RESTART_THRESHOLD) {
        logger.error({ pid, restarts: workerRestarts }, '❌ Worker restart limit exceeded');
        return;
      }

      // Restart worker
      const newWorker = cluster.fork();
      logger.info({ oldPid: pid, newPid: newWorker.process.pid, workerId: newWorker.id }, '🔄 Worker restarted');
      
      restartCounts.set(newWorker.id, workerRestarts + 1);

      // Clear restart count after window expires
      setTimeout(() => {
        restartCounts.delete(newWorker.id);
      }, RESTART_WINDOW);
    });

    // Handle worker online event
    cluster.on("online", (worker) => {
      logger.info({ pid: worker.process.pid, workerId: worker.id }, '💚 Worker online');
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('🛑 Shutting down cluster');
      
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        if (worker) {
          logger.info({ pid: worker.process.pid, workerId: worker.id }, 'Sending shutdown signal to worker');
          worker.send("shutdown");
          
          // Force kill after timeout
          setTimeout(() => {
            if (!worker.isDead()) {
              logger.warn({ pid: worker.process.pid }, 'Force killing worker');
              worker.kill();
            }
          }, 10000); // 10 second timeout
        }
      }

      // Exit master process after all workers are done
      setTimeout(() => {
        logger.info('👋 Master process exiting');
        process.exit(0);
      }, 12000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // Monitor memory usage
    if (clusterConfig.memory.enabled) {
      setInterval(() => {
        const used = process.memoryUsage();
        const rssMB = Math.round(used.rss / 1024 / 1024);
        const heapMB = Math.round(used.heapUsed / 1024 / 1024);
        logger.debug({ rss: rssMB, heap: heapMB, unit: 'MB' }, '📊 Master memory usage');
      }, 60000); // Every minute
    }
  } else {
    // Worker process - load the server
    require("./server");
    
    // Handle shutdown message from master
    process.on("message", (msg) => {
      if (msg === "shutdown") {
        logger.info({ pid: process.pid }, 'Worker received shutdown signal');
        // Perform graceful shutdown
        setTimeout(() => {
          process.exit(0);
        }, 5000);
      }
    });

    // Monitor worker memory
    if (clusterConfig.memory.enabled) {
      setInterval(() => {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        const rssMB = Math.round(used.rss / 1024 / 1024);
        
        logger.debug({ pid: process.pid, rss: rssMB, heap: heapUsedMB, unit: 'MB' }, '📊 Worker memory usage');
        
        // Alert if memory exceeds threshold
        if (rssMB > clusterConfig.memory.thresholdMB) {
          logger.warn({ pid: process.pid, rss: rssMB, threshold: clusterConfig.memory.thresholdMB, unit: 'MB' }, '⚠️  Worker memory threshold exceeded');
        }
      }, 60000);
    }
  }
}
