import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Use SvelteKit's env system or fallback to process.env for serverless environments
let redisUrl: string;
let redisToken: string;

try {
  // Try to get from SvelteKit's env (for local development)
  redisUrl = env.STORAGE_KV_REST_API_URL;
  redisToken = env.STORAGE_KV_REST_API_TOKEN;
} catch (error) {
  // Fallback to process.env (for Vercel production)
  redisUrl = process.env.STORAGE_KV_REST_API_URL || '';
  redisToken = process.env.STORAGE_KV_REST_API_TOKEN || '';
  
  console.log('Using process.env fallback for Redis config');
}

if (!redisUrl || !redisToken) {
  console.error('Missing Redis configuration. URL:', !!redisUrl, 'Token:', !!redisToken);
  throw new Error("Missing Upstash Redis configuration in env vars.");
}

const redis = new Redis({ url: redisUrl, token: redisToken });

export class ActionLogger {
    private prefix: string;
    
    constructor(prefix = 'user_action:') {
        this.prefix = prefix;
    }
    
    /**
     * Log a user action to Redis
     */
    async logAction(userId: string, action: string, metadata: Record<string, any> = {}) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                userId,
                action,
                metadata
            };
            
            // Generate a unique ID for this log entry
            const entryId = `${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
            const key = `${this.prefix}${entryId}`;
            
            // Store the log entry as a JSON string
            await redis.set(key, JSON.stringify(logEntry));
            
            // Add to list of all actions
            await redis.lpush(`${this.prefix}all`, entryId);
            
            // Add to user's specific list of actions
            await redis.lpush(`${this.prefix}user:${userId}`, entryId);
            
            // Add to action type list
            await redis.lpush(`${this.prefix}action:${action}`, entryId);
            
            return true;
        } catch (error) {
            console.error('Error logging action to Redis:', error);
            return false;
        }
    }
}