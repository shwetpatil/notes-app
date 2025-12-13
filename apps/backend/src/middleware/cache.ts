import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { logger } from '../config/logger.config';

/**
 * Cache middleware for GET requests
 * Caches response body based on cache key
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key from URL and user ID
      const userId = req.session?.user?.id;
      if (!userId) {
        return next();
      }

      const cacheKey = `route:${req.originalUrl}:user:${userId}`;
      
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        logger.debug({ cacheKey }, 'Serving from cache');
        res.json(cachedData);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any): Response {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch((error) => {
          logger.error({ error, cacheKey }, 'Failed to cache response');
        });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ error }, 'Cache middleware error');
      next();
    }
  };
};

/**
 * Invalidate cache after successful mutation
 */
export const invalidateCacheMiddleware = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data: any): Response {
      // Only invalidate on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.session?.user?.id;
        if (userId) {
          Promise.all(
            patterns.map((pattern) =>
              cacheService.deletePattern(pattern.replace(':userId', userId))
            )
          ).catch((error) => {
            logger.error({ error, patterns }, 'Failed to invalidate cache');
          });
        }
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};
