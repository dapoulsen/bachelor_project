import fs from 'fs';
import path from 'path';
import { ActionLogger } from './actionLogger';

export class ActionAnalytics {
    private logFilePath: string;
    
    constructor(logFilePath = path.join(process.cwd(), 'user_actions.log')) {
        this.logFilePath = logFilePath;
    }
    
    /**
     * Get button click statistics for a specific user or all users
     */
    getButtonClickStats(userId?: string) {
        if (!fs.existsSync(this.logFilePath)) {
            return {};
        }
        
        const logs = fs.readFileSync(this.logFilePath, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));
        
        const stats: Record<string, number> = {};
        
        for (const log of logs) {
            // Filter by user ID if provided
            if (userId && log.userId !== userId) {
                continue;
            }
            
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
    }
    
    /**
     * Get list of all users who have logged actions
     */
    getAllUsers() {
        if (!fs.existsSync(this.logFilePath)) {
            return [];
        }
        
        const logs = fs.readFileSync(this.logFilePath, 'utf8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));
        
        const userSet = new Set<string>();
        logs.forEach(log => log.userId && userSet.add(log.userId));
        
        return Array.from(userSet);
    }
}