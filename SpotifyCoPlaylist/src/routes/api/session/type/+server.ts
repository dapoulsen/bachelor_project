import { clearSessionType, getSessionType, setSessionType} from '$lib/Server/session';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    try {
        const sessionType = await getSessionType();
        console.log('GET session type:', sessionType);
        return json({
            sessionType: sessionType || 'none'
        });
    } catch (error) {
        console.error('Error in GET session type:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        console.log('POST session type:', data);
        if (data){
            console.log('POST session type: Setting session type:', data.sessionType);
            await setSessionType(data.sessionType);
            return json({
                success: true,
                message: 'Session type updated'
            });
        } else {
            console.error('POST session type: No session type provided');
            return json({
                success: false,
                message: 'No session type provided'
            });
        }
    } catch (error) {
        console.error('Error in POST session type:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

export const DELETE: RequestHandler = async () => {
    try {
        console.log('DELETE session type: Clearing session type');
        await clearSessionType();
        return json({
            success: true,
            message: 'Session type cleared successfully'
        });
    } catch (error) {
        console.error('Error in DELETE session type:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}