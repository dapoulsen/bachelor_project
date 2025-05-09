import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ActionLogger } from '$lib/Server/actionLogger';

// Create a logger instance
const logger = new ActionLogger();

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { userId, action, metadata } = await request.json();
        
        if (!userId || !action) {
            return json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }
        
        // Log the action (now async)
        const success = await logger.logAction(userId, action, metadata);
        
        if (!success) {
            return json({ success: false, error: 'Failed to log action' }, { status: 500 });
        }
        
        return json({ success: true });
    } catch (error) {
        console.error('Error logging action:', error);
        return json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
};