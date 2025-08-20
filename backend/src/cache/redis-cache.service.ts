import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache, CachingConfig } from 'cache-manager';
import { RedisStore } from 'cache-manager-redis-store';

declare module 'cache-manager' {
  interface CachingConfig {
    ttl: number;
  }

  interface Store {
    getClient?(): any;
    mget?(...args: any[]): Promise<any>;
    mset?(...args: any[]): Promise<any>;
    mdel?(...args: any[]): Promise<any>;
    keys?(pattern: string): Promise<string[]>;
    reset?(): Promise<void>;
  }
}

type RedisCache = Omit<Cache, 'store'> & {
  store: RedisStore;
  get<T = any>(key: string): Promise<T | undefined>;
  set<T = any>(key: string, value: T, options?: CachingConfig): Promise<void>;
  del(key: string): Promise<void>;
  reset?(): Promise<void>;
};

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly cache: RedisCache;
  private readonly store: any; // Using any to avoid type issues with RedisStore
  private readonly defaultTtl: number;
  private readonly keyPrefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.cache = this.cacheManager as unknown as RedisCache;
    this.store = this.cache.store;
    this.defaultTtl = 300; // 5 minutes default TTL
    this.keyPrefix = process.env.REDIS_KEY_PREFIX || 'workflowguard:';
  }

  private getPrefixedKey(key: string): string {
    return key.startsWith(this.keyPrefix) ? key : `${this.keyPrefix}${key}`;
  }

  private removeKeyPrefix(key: string): string {
    return key.startsWith(this.keyPrefix) 
      ? key.substring(this.keyPrefix.length) 
      : key;
  }

  private getTtlFromOptions(optionsOrTtl?: number | CacheOptions): number {
    if (typeof optionsOrTtl === 'number') {
      return optionsOrTtl;
    }
    if (optionsOrTtl?.ttl !== undefined) {
      return optionsOrTtl.ttl;
    }
    return this.defaultTtl;
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!key) {
      throw new Error('Cache key cannot be empty');
    }
    
    const prefixedKey = this.getPrefixedKey(key);
    this.logger.debug(`Getting key: ${prefixedKey}`);
    
    try {
      return await this.cache.get<T>(prefixedKey);
    } catch (error) {
      this.logger.error(`Error getting key ${prefixedKey} from cache:`, error);
      return undefined;
    }
  }

  async set<T>(
    key: string,
    value: T,
    optionsOrTtl?: number | CacheOptions,
  ): Promise<void> {
    if (!key) {
      throw new Error('Cache key cannot be empty');
    }
    
    const prefixedKey = this.getPrefixedKey(key);
    const ttl = this.getTtlFromOptions(optionsOrTtl);
    
    this.logger.debug(`Setting key: ${prefixedKey} with TTL: ${ttl}s`);
    
    try {
      await this.cache.set(prefixedKey, value, { ttl } as CachingConfig);
    } catch (error) {
      this.logger.error(`Error setting key ${prefixedKey} in cache:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!key) {
      return;
    }
    
    const prefixedKey = this.getPrefixedKey(key);
    this.logger.debug(`Deleting key: ${prefixedKey}`);
    
    try {
      await this.cache.del(prefixedKey);
    } catch (error) {
      this.logger.error(`Error deleting key ${prefixedKey} from cache:`, error);
    }
  }

  async reset(): Promise<boolean> {
    this.logger.warn('Resetting entire cache');
    
    try {
      // Try reset using the client if available
      if (this.store.getClient) {
        const client = this.store.getClient();
        if (client && typeof client.flushdb === 'function') {
          await client.flushdb();
          return true;
        }
      }
      
      // Fallback to manual key deletion if reset is not available
      const keys = await this.store.keys(`${this.keyPrefix}*`);
      if (Array.isArray(keys)) {
        await Promise.all(keys.map((key: string) => this.del(key)));
        return true;
      }
      
      this.logger.warn('Cache reset not supported by store');
      return false;
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
      return false;
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    optionsOrTtl?: number | CacheOptions,
  ): Promise<T> {
    if (!key) {
      throw new Error('Cache key cannot be empty');
    }
    
    const prefixedKey = this.getPrefixedKey(key);
    const ttl = this.getTtlFromOptions(optionsOrTtl);
    
    // Try to get from cache first
    const cached = await this.get<T>(prefixedKey);
    if (cached !== undefined) {
      this.logger.debug(`Cache hit for key: ${prefixedKey}`);
      return cached;
    }
    
    this.logger.debug(`Cache miss for key: ${prefixedKey}`);
    
    // Execute the function and cache the result
    try {
      const result = await fn();
      await this.set(prefixedKey, result, { ttl });
      return result;
    } catch (error) {
      this.logger.error(`Error executing wrapped function for key ${prefixedKey}:`, error);
      throw error;
    }
  }

  generateRequestKey(request: any): string {
    try {
      const { method, originalUrl, params, query, body, user } = request;
      
      const requestData = {
        method,
        url: originalUrl,
        params,
        query,
        ...(method !== 'GET' && { body }),
        ...(user?.id && { userId: user.id }),
      };

      const requestString = JSON.stringify(requestData);
      return this.hashString(requestString);
    } catch (error) {
      this.logger.error('Error generating cache key:', error);
      return `cache-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `cache-${Math.abs(hash).toString(36)}`;
  }
}
