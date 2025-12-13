import os from "os";

/**
 * Cluster and scaling configuration
 * Controls multi-core processing and memory monitoring
 */
export const clusterConfig = {
  enabled: process.env.CLUSTER_MODE === "true",
  maxWorkers: parseInt(
    process.env.MAX_WORKERS || String(os.cpus().length),
    10
  ),
  numCPUs: os.cpus().length,
  
  // Memory monitoring
  memory: {
    enabled: process.env.ENABLE_MEMORY_MONITORING === "true",
    thresholdMB: parseInt(process.env.MEMORY_THRESHOLD_MB || "512", 10),
  },
} as const;
