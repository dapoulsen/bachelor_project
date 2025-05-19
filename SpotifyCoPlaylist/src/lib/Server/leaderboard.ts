import type { SpotifyTrack } from "$lib/types";
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

class LeaderboardState {
    private readonly LEADERBOARD_KEY = 'spotify_leaderboard';
    private readonly STATUS_KEY = 'spotify_leaderboard_status';

    async addToLeaderboard(item: SpotifyTrack) {
        // Get current leaderboard
        const leaderboard = await this.getLeaderboardData();
        
        // Check if track exists
        const existingTrack = leaderboard.find(entry => entry.track.id === item.id);
        
        if (!existingTrack) {
            // Add new track
            leaderboard.push({ track: item, votes: 1 });
            
            // Save updated leaderboard
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
        } else {
            // Increment votes for existing track
            existingTrack.votes++;
            // Save updated leaderboard
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
        }
        
        return this.getStatus();
    }

    async initialize() {
        console.log("Starting initialization...");
        
        try {
            // Set empty leaderboard
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify([]));
            console.log("Leaderboard key set to empty array");
            
            // Set initialized status
            await redis.set(this.STATUS_KEY, JSON.stringify({ initialized: true }));
            console.log("Status key set to initialized: true");
            
            return this.getStatus();
        } catch (error) {
            console.error("Redis initialization error:", error);
            throw error;
        }
    }

    async reset() {
        console.log('RESET CALLED!');
        await Promise.all([
            redis.set(this.LEADERBOARD_KEY, JSON.stringify([])),
            redis.set(this.STATUS_KEY, JSON.stringify({ initialized: false }))
        ]);
        return this.getStatus();
    }

    async getStatus() {
        const [leaderboard, statusData] = await Promise.all([
            this.getLeaderboardData(),
            this.getStatusData()
        ]);
        
        return {
            list: leaderboard,
            initialized: statusData.initialized
        };
    }

    async removeFromLeaderboard(itemId: string) {
        const leaderboard = await this.getLeaderboardData();
        const filtered = leaderboard.filter(entry => entry.track.id !== itemId);
        await redis.set(this.LEADERBOARD_KEY, JSON.stringify(filtered));
        return this.getStatus();
    }

    async incrementVotes(itemId: string) {
        const leaderboard = await this.getLeaderboardData();
        const existingTrack = leaderboard.find(entry => entry.track.id === itemId);
        
        if (existingTrack) {
            existingTrack.votes++;
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
        }
        
        return this.getStatus();
    }

    async decrementVotes(itemId: string) {
        const leaderboard = await this.getLeaderboardData();
        const existingTrack = leaderboard.find(entry => entry.track.id === itemId);
        
        if (existingTrack) {
            existingTrack.votes--;
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
        }
        
        return this.getStatus();
    }
    
    async addVotesToTrack(itemId: string, votes: number) {
        const leaderboard = await this.getLeaderboardData();
        const existingTrack = leaderboard.find(entry => entry.track.id === itemId);
        if (existingTrack) {
            existingTrack.votes += votes;
            await redis.set(this.LEADERBOARD_KEY, JSON.stringify(leaderboard));
        }
        return this.getStatus();
    }

    async sortLeaderboard() {
        const leaderboard = await this.getLeaderboardData();
        const sorted = [...leaderboard].sort((a, b) => b.votes - a.votes);
        await redis.set(this.LEADERBOARD_KEY, JSON.stringify(sorted));
        return this.getStatus();
    }

    // Helper methods
    private async getLeaderboardData(): Promise<Array<{ track: SpotifyTrack, votes: number }>> {
        try {
            const data = await redis.get(this.LEADERBOARD_KEY);
            
            // If data is already an array (auto-parsed by client)
            if (Array.isArray(data)) {
                return data;
            }
            
            // Check if data exists and is a non-empty string
            if (data && typeof data === 'string' && data.trim() !== '') {
                try {
                    return JSON.parse(data);
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

    private async getStatusData(): Promise<{ initialized: boolean }> {
        try {
            const data = await redis.get(this.STATUS_KEY);
            
            // Check if data exists and is an object with the initialized property
            if (data && typeof data === 'object' && 'initialized' in data) {
                return data as { initialized: boolean };
            }
            
            // If data is a string (old format or not auto-parsed)
            if (data && typeof data === 'string' && data.trim() !== '') {
                try {
                    return JSON.parse(data);
                } catch (parseError) {
                    console.error('Error parsing status data:', parseError);
                    return { initialized: false };
                }
            }
            
            // Default case
            return { initialized: false };
        } catch (error) {
            console.error('Error fetching status data from Redis:', error);
            return { initialized: false };
        }
    }
}

export const leaderboardState = new LeaderboardState();