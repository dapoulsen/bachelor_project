import fs from 'fs';
import path from 'path';

export class ActionLogger {
    private logFilePath: string;
    
    constructor(logFilePath = path.join(process.cwd(), 'user_actions.log')) {
        this.logFilePath = logFilePath;
        
        // Ensure the log directory exists
        const logDir = path.dirname(logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Create file if it doesn't exist
        if (!fs.existsSync(logFilePath)) {
            fs.writeFileSync(logFilePath, '');
        }
    }
    
    /**
     * Log a user action to the single log file
     */
    logAction(userId: string, action: string, metadata: Record<string, any> = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            userId,
            action,
            metadata
        };
        
        fs.appendFileSync(
            this.logFilePath, 
            JSON.stringify(logEntry) + '\n', 
            { encoding: 'utf8' }
        );
    }
}