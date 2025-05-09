import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// Reuse same Redis connection setup
let redisUrl: string;
let redisToken: string;

try {
    redisUrl = env.STORAGE_KV_REST_API_URL;
    redisToken = env.STORAGE_KV_REST_API_TOKEN;
} catch (error) {
    redisUrl = process.env.STORAGE_KV_REST_API_URL || '';
    redisToken = process.env.STORAGE_KV_REST_API_TOKEN || '';
}

if (!redisUrl || !redisToken) {
    console.error('Missing Redis configuration for LogAnalytics');
    throw new Error("Missing Upstash Redis configuration in env vars.");
}

const redis = new Redis({ url: redisUrl, token: redisToken });

export class ActionAnalytics {
    private prefix: string;
    
    constructor(prefix = 'user_action:') {
        this.prefix = prefix;
    }
    
    /**
     * Get button click statistics for a specific user or all users
     */
    async getButtonClickStats(userId?: string) {
        try {
            // Get list of actions to analyze
            let actionIds: string[];
            
            if (userId) {
                // Get user-specific actions
                actionIds = await redis.lrange(`${this.prefix}user:${userId}`, 0, -1);
            } else {
                // Get all actions
                actionIds = await redis.lrange(`${this.prefix}all`, 0, -1);
            }
            
            const stats: Record<string, number> = {};
            
            // Process each action
            for (const actionId of actionIds) {
                const logEntryRaw = await redis.get(`${this.prefix}${actionId}`);
                
                if (!logEntryRaw) continue;
                
                const log = JSON.parse(logEntryRaw as string);
                
                // For actions that are button clicks
                if (['change_view', 'vote', 'add_song'].includes(log.action)) {
                    const actionKey = log.action;
                    
                    // Count each action type
                    stats[actionKey] = (stats[actionKey] || 0) + 1;
                    
                    // Add more specific counters based on metadata
                    if (log.action === 'vote') {
                        const voteKey = `vote_${log.metadata.voteType}`;
                        stats[voteKey] = (stats[voteKey] || 0) + 1;
                    }
                    
                    if (log.action === 'change_view') {
                        const viewKey = `view_${log.metadata.viewName}`;
                        stats[viewKey] = (stats[viewKey] || 0) + 1;
                    }
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Error analyzing logs:', error);
            return {};
        }
    }
    
    /**
     * Get list of all users who have logged actions
     */
    async getAllUsers() {
        try {
            // Get all action IDs
            const actionIds = await redis.lrange(`${this.prefix}all`, 0, -1);
            const userSet = new Set<string>();
            
            // Process each action to extract unique user IDs
            for (const actionId of actionIds) {
                const logEntryRaw = await redis.get(`${this.prefix}${actionId}`);
                
                if (!logEntryRaw) continue;
                
                const log = JSON.parse(logEntryRaw as string);
                
                if (log.userId) {
                    userSet.add(log.userId);
                }
            }
            
            return Array.from(userSet);
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }
    
    /**
     * Get all raw logs, optionally filtered by user
     */
    async getRawLogs(userId?: string, limit: number = 100) {
        try {
            // Get list of actions
            let actionIds: string[];
            
            if (userId) {
                actionIds = await redis.lrange(`${this.prefix}user:${userId}`, 0, limit - 1);
            } else {
                actionIds = await redis.lrange(`${this.prefix}all`, 0, limit - 1);
            }
            
            const logs = [];
            
            // Get each log entry
            for (const actionId of actionIds) {
                const logEntryRaw = await redis.get(`${this.prefix}${actionId}`);
                
                if (logEntryRaw) {
                    logs.push(JSON.parse(logEntryRaw as string));
                }
            }
            
            return logs;
        } catch (error) {
            console.error('Error getting raw logs:', error);
            return [];
        }
    }
}