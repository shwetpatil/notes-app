'use client';

import { useEffect, useState } from 'react';

interface SystemMetrics {
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  cpu: {
    count: number;
    model: string;
    loadAverage: {
      '1min': number;
      '5min': number;
      '15min': number;
    };
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
  };
  timestamp: number;
}

interface APIMetrics {
  totalRequests: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  statusCodes: Record<number, number>;
  paths: Record<string, number>;
  timestamp: number;
}

export function MetricsDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [apiMetrics, setApiMetrics] = useState<APIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const [systemRes, apiRes] = await Promise.all([
        fetch(`${apiUrl}/api/metrics/system`),
        fetch(`${apiUrl}/api/metrics`),
      ]);

      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemMetrics(systemData);
      }

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.totalRequests) {
          setApiMetrics(apiData);
        }
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Server Metrics
      </h2>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Memory */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Memory Usage
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                Used: {systemMetrics.memory.used} MB / {systemMetrics.memory.total} MB
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    systemMetrics.memory.percentage > 80
                      ? 'bg-red-500'
                      : systemMetrics.memory.percentage > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${systemMetrics.memory.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {systemMetrics.memory.percentage.toFixed(1)}% used
              </p>
            </div>
          </div>

          {/* CPU */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              CPU ({systemMetrics.cpu.count} cores)
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>Load Average:</p>
              <p>1 min: {systemMetrics.cpu.loadAverage['1min']}</p>
              <p>5 min: {systemMetrics.cpu.loadAverage['5min']}</p>
              <p>15 min: {systemMetrics.cpu.loadAverage['15min']}</p>
            </div>
          </div>

          {/* Process */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Process Info
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>PID: {systemMetrics.process.pid}</p>
              <p>Uptime: {Math.floor(systemMetrics.process.uptime / 60)} min</p>
              <p>Heap: {systemMetrics.process.memoryUsage.heapUsed} MB</p>
              <p>RSS: {systemMetrics.process.memoryUsage.rss} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* API Metrics */}
      {apiMetrics && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            API Performance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Requests
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {apiMetrics.totalRequests}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {apiMetrics.avgDuration}ms
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                P95
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {apiMetrics.percentiles.p95}ms
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                P99
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {apiMetrics.percentiles.p99}ms
              </p>
            </div>
          </div>

          {/* Status Codes */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Status Codes
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(apiMetrics.statusCodes).map(([code, count]) => (
                <div
                  key={code}
                  className={`p-2 rounded ${
                    code.startsWith('2')
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : code.startsWith('4')
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
                  <span className="font-bold">{code}</span>: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
