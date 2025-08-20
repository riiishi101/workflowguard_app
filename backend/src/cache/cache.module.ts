import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import { RedisCacheService } from './redis-cache.service';
import { redisStore } from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const ttl = configService.get<number>('CACHE_TTL', 300); // Default 5 minutes

        logger.log(`Initializing Redis cache at ${redisHost}:${redisPort}`);
        
        return {
          store: redisStore,
          socket: {
            host: redisHost,
            port: redisPort,
          },
          password: redisPassword,
          ttl,
          max: 1000, // Maximum number of items in cache
          isGlobal: true,
          // Disable client caching in test environment
          noMutexHostport: process.env.NODE_ENV === 'test',
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [NestCacheModule, RedisCacheService],
})
export class AppCacheModule {}
