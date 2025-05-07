import type { SpotifyTrack } from "$lib/types";
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Updated to include progress and playing state
interface CurrentSongState {
    song: SpotifyTrack | null;
    progress_ms: number;
    is_playing: boolean;
}

// Redis setup - similar to leaderboard.ts
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

// Initialize Redis client
const redis = new Redis({
    url: redisUrl,
    token: redisToken,
});

// Redis keys
const SONG_KEY = 'current_song';
const PROGRESS_KEY = 'song_progress';
const PLAYING_KEY = 'is_playing';

export async function setCurrentSong(song: SpotifyTrack, progress_ms: number = 0, is_playing: boolean = true): Promise<CurrentSongState> {
    console.log('Setting current song:', song.name, 'Progress:', progress_ms, 'Playing:', is_playing);
    
    // Store values in Redis - ensure proper JSON stringification
    await redis.set(SONG_KEY, JSON.stringify(song.name));
    await redis.set(PROGRESS_KEY, progress_ms);
    await redis.set(PLAYING_KEY, is_playing);
    
    return {
        song,
        progress_ms,
        is_playing
    };
}

export async function getCurrentSong(): Promise<CurrentSongState> {
    // Get values from Redis
    const songJson = await redis.get<string>(SONG_KEY);
    const progress_ms = await redis.get<number>(PROGRESS_KEY) || 0;
    const is_playing = await redis.get<boolean>(PLAYING_KEY) || false;
    
    let song: SpotifyTrack | null = null;
    
    // Add error handling for JSON parsing
    if (songJson) {
        try {
            // Check if the string is actually the string "[object Object]"
            if (songJson === "[object Object]") {
                console.error("Invalid song data stored in Redis: [object Object]");
            } else {
                console.log(songJson)
                song = JSON.parse(songJson) as SpotifyTrack;
                console.log('Parsed song:', song);
            }
        } catch (err) {
            console.error("Error parsing song JSON:", err);
        }
    }
    
    if (!song) {
        console.log('No current song set or invalid song data.');
        return { song: null, progress_ms: 0, is_playing: false };
    }
    
    console.log('Getting current song:', song.name);
    return {
        song,
        progress_ms,
        is_playing
    };
}

export async function updateSongProgress(progress_ms: number): Promise<void> {
    const songJson = await redis.get<string>(SONG_KEY);
    if (songJson) {
        await redis.set(PROGRESS_KEY, progress_ms);
    }
}

export async function updatePlayingState(is_playing: boolean): Promise<void> {
    const songJson = await redis.get<string>(SONG_KEY);
    if (songJson) {
        await redis.set(PLAYING_KEY, is_playing);
    }
}

// Function to reset current song state - useful when stopping a session
export async function resetCurrentSong(): Promise<void> {
    await redis.del(SONG_KEY);
    await redis.del(PROGRESS_KEY);
    await redis.del(PLAYING_KEY);
    console.log('Current song state reset');
}
