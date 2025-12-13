import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisClient } from '../config/redis';
import { logger } from '../config/logger.config';

// Fallback to memory-based rate limiter if Redis is unavailable
let authLimiter: RateLimiterRedis | RateLimiterMemory;
let apiLimiter: RateLimiterRedis | RateLimiterMemory;
let strictLimiter: RateLimiterRedis | RateLimiterMemory;
let searchLimiter: RateLimiterRedis | RateLimiterMemory;

// Initialize rate limiters
const initializeRateLimiters = () => {
  const client = redisClient.getClient();
  const useRedis = redisClient.isReady() && client !== null;

  if (useRedis) {
    logger.info('Initializing Redis-backed rate limiters');
    
    // Authentication endpoints - strict limits
    authLimiter = new RateLimiterRedis({
      storeClient: client,
      keyPrefix: 'rl:auth',
      points: 5, // 5 requests
      duration: 15 * 60, // per 15 minutes
      blockDuration: 15 * 60, // Block for 15 minutes if exceeded
    });

    // General API endpoints
    apiLimiter = new RateLimiterRedis({
      storeClient: client,
      keyPrefix: 'rl:api',
      points: 100, // 100 requests
      duration: 60, // per 1 minute
      blockDuration: 60, // Block for 1 minute
    });

    // Strict limits for expensive operations
    strictLimiter = new RateLimiterRedis({
      storeClient: client,
      keyPrefix: 'rl:strict',
      points: 10, // 10 requests
      duration: 60, // per 1 minute
      blockDuration: 5 * 60, // Block for 5 minutes
    });

    // Search endpoints - moderate limits
    searchLimiter = new RateLimiterRedis({
      storeClient: client,
      keyPrefix: 'rl:search',
      points: 30, // 30 searches
      duration: 60, // per 1 minute
      blockDuration: 60, // Block for 1 minute
    });
  } else {
    logger.warn('Redis unavailable - using memory-based rate limiters');
    
    // Fallback to memory storage
    authLimiter = new RateLimiterMemory({
      points: 5,
      duration: 15 * 60,
      blockDuration: 15 * 60,
    });

    apiLimiter = new RateLimiterMemory({
      points: 100,
      duration: 60,
      blockDuration: 60,
    });

    strictLimiter = new RateLimiterMemory({
      points: 10,
      duration: 60,
      blockDuration: 5 * 60,
    });

    searchLimiter = new RateLimiterMemory({
      points: 30,
      duration: 60,
      blockDuration: 60,
    });
  }
};

// Initialize on module load
initializeRateLimiters();

// Re-initialize if Redis becomes available
redisClient.getClient()?.on('ready', () => {
  initializeRateLimiters();
});

/**
 * Create rate limiter middleware
 */
const createRateLimiter = (limiter: RateLimiterRedis | RateLimiterMemory, name: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Use IP address or user ID as key
      const key = req.session?.user?.id || req.ip || 'anonymous';
      
      await limiter.consume(key);
      
      next();
    } catch (rejRes) {
      const error = rejRes as RateLimiterRes;
      const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 60;
      
      logger.warn({
        limiter: name,
        key: req.session?.user?.id || req.ip,
        path: req.path,
        retryAfter,
      }, 'Rate limit exceeded');
      
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter,
      });
    }
  };
};

/**
 * Rate limiter for authentication endpoints
 * Very strict: 5 requests per 15 minutes
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  return createRateLimiter(authLimiter, 'auth')(req, res, next);
};

/**
 * Rate limiter for general API endpoints
 * Moderate: 100 requests per minute
 */
export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  return createRateLimiter(apiLimiter, 'api')(req, res, next);
};

/**
 * Rate limiter for expensive operations
 * Strict: 10 requests per minute
 */
export const strictRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  return createRateLimiter(strictLimiter, 'strict')(req, res, next);
};

/**
 * Rate limiter for search endpoints
 * Moderate: 30 requests per minute
 */
export const searchRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  return createRateLimiter(searchLimiter, 'search')(req, res, next);
};

/**
 * Custom rate limiter with configurable options
 */
export const customRateLimiter = (options: {
  points: number;
  duration: number;
  blockDuration?: number;
  keyPrefix?: string;
}) => {
  const client = redisClient.getClient();
  const useRedis = redisClient.isReady() && client !== null;

  const limiter = useRedis
    ? new RateLimiterRedis({
        storeClient: client,
        keyPrefix: options.keyPrefix || 'rl:custom',
        points: options.points,
        duration: options.duration,
        blockDuration: options.blockDuration || options.duration,
      })
    : new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
        blockDuration: options.blockDuration || options.duration,
      });

  return createRateLimiter(limiter, options.keyPrefix || 'custom');
};

/**
 * Rate limiter for user-specific actions
 * Uses user ID as key for authenticated users
 */
export const userRateLimiter = (points: number, duration: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session?.user?.id) {
      return next();
    }

    const limiter = new RateLimiterMemory({
      points,
      duration,
    });

    try {
      await limiter.consume(req.session.user.id);
      next();
    } catch (error) {
      const err = error as RateLimiterRes;
      const retryAfter = Math.ceil(err.msBeforeNext / 1000) || 60;
      
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        error: 'Too many requests from this account, please try again later',
        retryAfter,
      });
    }
  };
};

export default {
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  searchRateLimiter,
  customRateLimiter,
  userRateLimiter,
};
