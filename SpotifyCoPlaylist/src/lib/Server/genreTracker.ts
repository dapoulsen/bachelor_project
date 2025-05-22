import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';
import type { TrackTagsResponse } from '$lib/lastFmApi';

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

const GENRE_TRACKER_KEY = 'genre_tracker';

export async function getGenreTrackerData(): Promise<Array< { genre: string, votes: number }>> {
    try{ 
            let data = await redis.get(GENRE_TRACKER_KEY);
            
            // Check if data exists and is a non-empty string
            if (data) {
                try {
                    return data as Array<{ genre: string, votes: number }>;
                } catch (parseError) {
                    console.error('Error parsing leaderboard data:', parseError);
                    return [];
                }
            }
            
            // If no data or empty string, return empty array
            return [];
        } catch (error) {
            console.error('Error fetching leaderboard data from Redis:', error);
            return [];
        }
}

export async function addVotesToGenreFromTrack(tags: any[]): Promise<void> {
    try {
        let genreTracker = await getGenreTrackerData();
        for (let tag of tags) {
            let genre = tag.name;
            let existingGenre = genreTracker.find((g) => g.genre === genre);
            if (existingGenre) {
                existingGenre.votes += 1;
            } else {
                genreTracker.push({ genre: genre, votes: 1 });
            }
        }
        // Set the updated genre tracker data back to Redis
        await redis.set(GENRE_TRACKER_KEY, JSON.stringify(genreTracker));
        // Sort genres by votes in descending order
        genreTracker = await sortGenreTracker();
        await redis.set(GENRE_TRACKER_KEY, JSON.stringify(genreTracker));

    } catch (error) {
        console.error('Error adding votes to genre:', error);
    }
}

async function sortGenreTracker(): Promise<Array <{ genre: string, votes: number }>> {
    const genreTracker = await getGenreTrackerData();
    genreTracker.sort((a, b) => b.votes - a.votes);
    // Set the sorted genre tracker data back to Redis
    console.log('Sorted genre tracker:', genreTracker);
    await redis.set(GENRE_TRACKER_KEY, JSON.stringify(genreTracker));
    return genreTracker;
}

export async function clearGenreTracker(): Promise<void> {
    await redis.set(GENRE_TRACKER_KEY, JSON.stringify([]));
}