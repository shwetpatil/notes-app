import cluster from "cluster";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

const numCPUs = os.cpus().length;
const MAX_WORKERS = parseInt(process.env.MAX_WORKERS || String(numCPUs), 10);
const workers = Math.min(MAX_WORKERS, numCPUs);

/**
 * Start the application in cluster mode to utilize all available CPU cores
 * This enables vertical scaling by allowing Node.js to utilize multiple cores
 */
export function startCluster() {
  if (cluster.isPrimary) {
    console.log(`🚀 Starting cluster with ${workers} workers (${numCPUs} CPUs available)`);
    console.log(`📊 Master process ${process.pid} is running`);

    // Track worker restarts to prevent restart loops
    const restartCounts = new Map<number, number>();
    const RESTART_THRESHOLD = 5;
    const RESTART_WINDOW = 60000; // 1 minute

    // Fork workers
    for (let i = 0; i < workers; i++) {
      const worker = cluster.fork();
      console.log(`✅ Worker ${worker.process.pid} started`);
    }

    // Handle worker exit and restart
    cluster.on("exit", (worker, code, signal) => {
      const pid = worker.process.pid;
      console.log(`⚠️  Worker ${pid} died (${signal || code})`);

      // Track restart count
      const now = Date.now();
      const workerRestarts = restartCounts.get(worker.id) || 0;
      
      if (workerRestarts >= RESTART_THRESHOLD) {
        console.error(`❌ Worker ${pid} has been restarted ${workerRestarts} times. Not restarting.`);
        return;
      }

      // Restart worker
      const newWorker = cluster.fork();
      console.log(`🔄 Restarting worker... New worker ${newWorker.process.pid} started`);
      
      restartCounts.set(newWorker.id, workerRestarts + 1);

      // Clear restart count after window expires
      setTimeout(() => {
        restartCounts.delete(newWorker.id);
      }, RESTART_WINDOW);
    });

    // Handle worker online event
    cluster.on("online", (worker) => {
      console.log(`💚 Worker ${worker.process.pid} is online`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log("\n🛑 Shutting down cluster...");
      
      for (const id in cluster.workers) {
        const worker = cluster.workers[id];
        if (worker) {
          console.log(`Sending shutdown signal to worker ${worker.process.pid}`);
          worker.send("shutdown");
          
          // Force kill after timeout
          setTimeout(() => {
            if (!worker.isDead()) {
              console.log(`Force killing worker ${worker.process.pid}`);
              worker.kill();
            }
          }, 10000); // 10 second timeout
        }
      }

      // Exit master process after all workers are done
      setTimeout(() => {
        console.log("👋 Master process exiting");
        process.exit(0);
      }, 12000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // Monitor memory usage
    if (process.env.ENABLE_MEMORY_MONITORING === "true") {
      setInterval(() => {
        const used = process.memoryUsage();
        console.log(`📊 Master Memory Usage: RSS=${Math.round(used.rss / 1024 / 1024)}MB, Heap=${Math.round(used.heapUsed / 1024 / 1024)}MB`);
      }, 60000); // Every minute
    }
  } else {
    // Worker process - load the server
    require("./server");
    
    // Handle shutdown message from master
    process.on("message", (msg) => {
      if (msg === "shutdown") {
        console.log(`Worker ${process.pid} received shutdown signal`);
        // Perform graceful shutdown
        setTimeout(() => {
          process.exit(0);
        }, 5000);
      }
    });

    // Monitor worker memory
    if (process.env.ENABLE_MEMORY_MONITORING === "true") {
      setInterval(() => {
        const used = process.memoryUsage();
        const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
        const rssMB = Math.round(used.rss / 1024 / 1024);
        
        console.log(`📊 Worker ${process.pid} Memory: RSS=${rssMB}MB, Heap=${heapUsedMB}MB`);
        
        // Alert if memory exceeds threshold
        const memoryThreshold = parseInt(process.env.MEMORY_THRESHOLD_MB || "512", 10);
        if (rssMB > memoryThreshold) {
          console.warn(`⚠️  Worker ${process.pid} memory usage (${rssMB}MB) exceeds threshold (${memoryThreshold}MB)`);
        }
      }, 60000);
    }
  }
}
