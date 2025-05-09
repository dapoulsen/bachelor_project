import { Redis } from '@upstash/redis';

/**
 * Script to clear user action logs from Redis
 * Usage: 
 * - npm run clear-logs
 * - npm run clear-logs -- --userId=user123
 * - npm run clear-logs -- --confirm=true
 */
async function clearLogs() {
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
    const prefix = args.prefix || 'user_action:';
    const confirmed = args.confirm === 'true';
    
    if (!confirmed) {
      console.error('This will permanently delete logs from Redis.');
      console.error('To confirm, add --confirm=true to the command.');
      process.exit(1);
    }
    
    console.log('Preparing to clear logs...');
    console.log('- User ID:', userId || 'All users');
    
    // Initialize Redis client
    const redis = new Redis({ url: redisUrl, token: redisToken });
    
    if (userId) {
      // For a specific user
      console.log(`Clearing logs for user: ${userId}`);
      
      // Get user's action IDs
      const actionIds = await redis.lrange(`${prefix}user:${userId}`, 0, -1);
      console.log(`Found ${actionIds.length} actions for user ${userId} to delete`);
      
      if (actionIds.length > 0) {
        // Delete each log entry
        for (const actionId of actionIds) {
          await redis.del(`${prefix}${actionId}`);
        }
        
        // Delete the user's action list
        await redis.del(`${prefix}user:${userId}`);
        
        console.log(`Deleted ${actionIds.length} log entries for user ${userId}`);
      }
    } else {
      // For all users
      console.log('Clearing ALL logs for ALL users');
      
      // Get all action IDs
      const allActionIds = await redis.lrange(`${prefix}all`, 0, -1);
      console.log(`Found ${allActionIds.length} total actions to delete`);
      
      if (allActionIds.length > 0) {
        // Delete each log entry
        for (const actionId of allActionIds) {
          await redis.del(`${prefix}${actionId}`);
        }
        
        // Find user action lists to delete
        const keys = await redis.keys(`${prefix}user:*`);
        console.log(`Found ${keys.length} user lists to delete`);
        
        // Delete each user's action list
        for (const key of keys) {
          await redis.del(key);
        }
        
        // Delete action type lists
        const actionKeys = await redis.keys(`${prefix}action:*`);
        for (const key of actionKeys) {
          await redis.del(key);
        }
        
        // Delete main list
        await redis.del(`${prefix}all`);
        
        console.log(`Cleared ${allActionIds.length} log entries and related lists`);
      } else {
        console.log('No logs found to clear');
      }
    }
    
    console.log('Log clearing completed successfully');
  } catch (error) {
    console.error('Error clearing logs:', error);
    process.exit(1);
  }
}

// Run the function
clearLogs().catch(console.error);