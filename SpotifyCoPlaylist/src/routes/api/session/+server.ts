import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { isSessionActive, setSessionStatus } from '$lib/Server/session';

export const GET: RequestHandler = async () => {
    try {
        const isActive = await isSessionActive();
        console.log('GET session:', isActive ? '✅ Active' : '❌ Inactive');
        
        return json({
            session: isActive ? 'active' : 'inactive'
        });
    } catch (error) {
        console.error('Error in GET session:', error);
        return json({ session: 'error' });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        console.log('POST session:', data);

        if (data && data.session) {
            console.log('POST session: Setting session:', data.session);
            await setSessionStatus(data.session === 'active');
        } else {
            console.error('POST session: No session provided');
            return json({
                success: false,
                message: 'No session provided'
            });
        }

        return json({
            success: true,
            session: await isSessionActive() ? 'active' : 'inactive'
        });
    } catch (error) {
        console.error('Error in POST session:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}