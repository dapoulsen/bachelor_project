import { json } from '@sveltejs/kit';
import { ActionAnalytics } from '$lib/Server/logAnalytics';
import type { RequestHandler } from './$types';
// You'd need to import your admin auth check functionality

const analytics = new ActionAnalytics();

export const GET: RequestHandler = async ({ url, request }) => {
    // Check admin authentication
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) return json({ error: 'Unauthorized' }, { status: 401 });
    
    const format = url.searchParams.get('format') || 'stats';
    const userId = url.searchParams.get('userId') || null;
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    
    try {
        if (format === 'raw') {
            // Get raw logs
            const logs = await analytics.getRawLogs(userId || undefined, limit);
            return json({ logs });
        } else {
            // Get analyzed stats
            const stats = await analytics.getButtonClickStats(userId || undefined);
            const users = await analytics.getAllUsers();
            
            return json({ 
                stats,
                users,
                totalUsers: users.length
            });
        }
    } catch (error) {
        console.error('Error retrieving logs:', error);
        return json({ error: 'Error retrieving logs' }, { status: 500 });
    }
};