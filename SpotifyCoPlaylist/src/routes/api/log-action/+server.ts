import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ActionLogger } from '$lib/actionLogger';
// import { UserActionLogger } from '$lib/userActionLogger'; // Uncomment for option 2

// Create a logger instance
const logger = new ActionLogger();
// const logger = new UserActionLogger(); // Uncomment for option 2

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userId, action, metadata } = await request.json();
        
        if (!userId || !action) {
            return json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }
        
        // Log the action
        logger.logAction(userId, action, metadata);
        
        return json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        return json({ success: false, error: 'Failed to log action' }, { status: 500 });
    }
};