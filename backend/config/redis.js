import Redis from 'ioredis';
import {RedisStore} from 'connect-redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = new Redis(process.env.REDIS_URL);


redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis connection error:', err));
 
export const redisSessionStore = new RedisStore({
    client: redisClient,
    prefix: 'sess:',
});
