import { writeFileSync } from 'fs';
import path from 'path';
import { Redis } from '@upstash/redis';

/**
 * Script to export user action logs from Redis to a file
 * Usage: 
 * - npm run export-logs
 * - npm run export-logs -- --userId=user123
 * - npm run export-logs -- --format=csv
 */
async function exportLogs() {
  // Get Redis configuration from environment variables
  let redisUrl: string;
  let redisToken: string;

  try {
    // Try to get from process.env for script environment
    redisUrl = process.env.STORAGE_KV_REST_API_URL || '';
    redisToken = process.env.STORAGE_KV_REST_API_TOKEN || '';

    if (!redisUrl || !redisToken) {
      console.error('Missing Redis configuration. Please set STORAGE_KV_REST_API_URL and STORAGE_KV_REST_API_TOKEN environment variables.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error accessing Redis credentials:', error);
    process.exit(1);
  }

  try {
    // Parse command line arguments
    const args = process.argv.slice(2).reduce((acc, arg) => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        acc[key] = value || true;
      }
      return acc;
    }, {} as Record<string, any>);

    // Get options
    const userId = args.userId;
    const format = args.format || 'json';
    const outputFile = args.output || `action_logs_${userId || 'all'}_${Date.now()}.${format}`;
    const outputPath = path.resolve(process.cwd(), outputFile);
    const limit = parseInt(args.limit || '1000', 10);
    const prefix = args.prefix || 'user_action:';

    console.log('Exporting logs...');
    console.log('- User ID:', userId || 'All users');
    console.log('- Format:', format);
    console.log('- Output:', outputPath);
    console.log('- Limit:', limit);
    
    // Initialize Redis client
    const redis = new Redis({ url: redisUrl, token: redisToken });
    
    // Get the logs
    console.log('Fetching logs from Redis...');
    
    // Get list of actions to retrieve
    let actionIds: string[];
    
    if (userId) {
      actionIds = await redis.lrange(`${prefix}user:${userId}`, 0, limit - 1);
      console.log(`Found ${actionIds.length} actions for user ${userId}`);
    } else {
      actionIds = await redis.lrange(`${prefix}all`, 0, limit - 1);
      console.log(`Found ${actionIds.length} actions total`);
    }
    
    const logs = [];
    
    // Get each log entry
    for (const actionId of actionIds) {
      const logEntryRaw = await redis.get(`${prefix}${actionId}`);
      
      if (logEntryRaw) {
        logs.push(JSON.parse(logEntryRaw as string));
      }
    }
    
    console.log(`Retrieved ${logs.length} valid log entries`);

    // Format the output according to requested format
    let output: string;
    
    if (format === 'csv') {
      // Create CSV format
      const headers = ['timestamp', 'userId', 'action', 'metadata'];
      const rows = logs.map(log => {
        return [
          log.timestamp,
          log.userId,
          log.action,
          JSON.stringify(log.metadata)
        ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
      });
      
      output = [headers.join(','), ...rows].join('\n');
    } else {
      // Default to JSON format
      output = JSON.stringify(logs, null, 2);
    }
    
    // Write to file
    writeFileSync(outputPath, output);
    
    console.log(`Logs exported successfully to ${outputPath}`);
    
    // If requested, also export stats
    if (args.stats) {
      const statsFile = outputFile.replace(`.${format}`, `_stats.json`);
      const statsPath = path.resolve(process.cwd(), statsFile);
      
      // Calculate basic stats
      const stats = {
        total: logs.length,
        byAction: {} as Record<string, number>,
        byUser: {} as Record<string, number>
      };
      
      // Process logs for stats
      for (const log of logs) {
        // Count by action type
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Count by user
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
        
        // Add more specific counters based on metadata
        if (log.action === 'vote' && log.metadata && log.metadata.voteType) {
          const voteKey = `vote_${log.metadata.voteType}`;
          stats.byAction[voteKey] = (stats.byAction[voteKey] || 0) + 1;
        }
        
        if (log.action === 'change_view' && log.metadata && log.metadata.viewName) {
          const viewKey = `view_${log.metadata.viewName}`;
          stats.byAction[viewKey] = (stats.byAction[viewKey] || 0) + 1;
        }
      }
      
      writeFileSync(statsPath, JSON.stringify(stats, null, 2));
      console.log(`Stats exported to ${statsPath}`);
    }
  } catch (error) {
    console.error('Error exporting logs:', error);
    process.exit(1);
  }
}

// Run the function
exportLogs().catch(console.error);