import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

export const connectRedis = async () => {
  if (process.env.NODE_ENV === 'test') {
    isRedisConnected = false;
    return;
  }
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    });

    redisClient.on('error', (err) => {
      console.warn('⚠️ Redis Client Error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🚀 Redis cache connected successfully');
      isRedisConnected = true;
    });

    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️ Could not connect to Redis. Falling back to MongoDB directly.', err.message);
    isRedisConnected = false;
  }
};

export const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis get cache error:', err);
    return null;
  }
};

export const setCache = async (key, value, durationSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: durationSeconds
    });
  } catch (err) {
    console.error('Redis set cache error:', err);
  }
};

export const invalidateFloorCache = async (floorId) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(`availability:${floorId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🧹 Invalidated ${keys.length} Redis cache keys for floor ${floorId}`);
    }
  } catch (err) {
    console.error('Redis invalidate floor cache error:', err);
  }
};
