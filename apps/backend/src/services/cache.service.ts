import { redisClient } from '../config/redis';
import { logger } from '../config/logger.config';

export class CacheService {
  private defaultTTL: number = 300; // 5 minutes

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        logger.debug('Redis not available, cache miss');
        return null;
      }

      const value = await client.get(key);
      if (!value) {
        logger.debug({ key }, 'Cache miss');
        return null;
      }

      logger.debug({ key }, 'Cache hit');
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        logger.debug('Redis not available, skipping cache set');
        return false;
      }

      await client.setEx(key, ttl, JSON.stringify(value));
      logger.debug({ key, ttl }, 'Cache set');
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return false;
      }

      await client.del(key);
      logger.debug({ key }, 'Cache delete');
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return false;
      }

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        logger.debug({ pattern, count: keys.length }, 'Cache pattern delete');
      }
      return true;
    } catch (error) {
      logger.error({ error, pattern }, 'Cache pattern delete error');
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return false;
      }

      await client.flushDb();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error({ error }, 'Cache clear error');
      return false;
    }
  }

  /**
   * Generate cache key for user notes
   */
  generateNotesKey(userId: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `notes:user:${userId}:${filterStr}`;
  }

  /**
   * Generate cache key for single note
   */
  generateNoteKey(noteId: string): string {
    return `note:${noteId}`;
  }

  /**
   * Generate cache key for user profile
   */
  generateUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Invalidate all caches for a user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.deletePattern(`notes:user:${userId}:*`);
    await this.delete(this.generateUserKey(userId));
  }

  /**
   * Invalidate cache for a specific note
   */
  async invalidateNoteCache(noteId: string, userId: string): Promise<void> {
    await this.delete(this.generateNoteKey(noteId));
    await this.invalidateUserCache(userId);
  }
}

export const cacheService = new CacheService();
export default cacheService;
