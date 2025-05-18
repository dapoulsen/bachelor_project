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

const SESSION_STATUS_KEY = 'session_status';
const SESSION_TYPE_KEY = 'session_type';

export async function isSessionActive(): Promise<boolean> {
    console.log('Checking session status...')
    // Get the session status from Redis
    let sessionStatus = await redis.get(SESSION_STATUS_KEY);
    console.log('Session status from Redis:', sessionStatus);
    return sessionStatus === true || sessionStatus === 'true'; 
}

export async function setSessionStatus(status: boolean) : Promise<void> {
    console.log('Setting session status:', status);
    //U
    // Store the session status in Redis
    await redis.set(SESSION_STATUS_KEY, status);
}

export async function setSessionType(type: string) : Promise<void> {
    console.log('Setting session type:', type);
    // Store the session type in Redis
    await redis.set(SESSION_TYPE_KEY, type);
}

export async function getSessionType(): Promise<string | null> {
    console.log('Getting session type...');
    // Get the session type from Redis
    let sessionType = await redis.get(SESSION_TYPE_KEY);
    console.log('Session type from Redis:', sessionType);
    return typeof sessionType === 'string' ? sessionType : null;
}

export async function clearSessionType(): Promise<void> {
    console.log('Clearing session type...');
    // Clear the session type in Redis
    await redis.del(SESSION_TYPE_KEY);
}