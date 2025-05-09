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

const ADMINTOKEN = 'admin_token';

export async function setAdminToken(token: string): Promise<string> {
    console.log('Setting admin token:', token);
    // Store the token in Redis
    await redis.set(ADMINTOKEN, token);
    //Get the token back to confirm it was set correctly
    let adminToken = await redis.get(ADMINTOKEN) as string;
    return adminToken;
}

export async function getAdminToken(): Promise<string> {
    console.log('Getting admin token...');
    // Get the token from Redis
    let adminToken = await redis.get(ADMINTOKEN) as string;
    if (!adminToken) {
        console.log('No admin token found in Redis.');
        return '';
    }
    return adminToken;
}

export async function clearAdminToken(): Promise<void> {
    console.log('Clearing admin token...');
    // Clear the token from Redis
    await redis.del(ADMINTOKEN);
    console.log('Admin token cleared.');
}