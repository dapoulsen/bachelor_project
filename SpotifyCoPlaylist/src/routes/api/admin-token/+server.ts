import { json } from "@sveltejs/kit";
import { getAdminToken, setAdminToken, clearAdminToken } from "$lib/Server/adminToken";
import type { RequestHandler } from "./$types";

// Get the admin token
export const GET: RequestHandler = async () => {
    try {
        const token = getAdminToken();
        console.log('GET admin-token request:', token ? '✅ Token exists' : '❌ No token');
        
        // Always return a properly formatted response
        return json({ 
            token: token || '',
            status: token ? 'active' : 'none'
        });
    } catch (error) {
        console.error('Error in GET admin-token:', error);
        return json({ token: '', status: 'error' });
    }
};

// Set or update the admin token
export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        
        if (!data || !data.token) {
            console.error('POST admin-token: No token provided');
            return json({ 
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('POST admin-token: Setting token:', data.token.substring(0, 5) + '...');
        setAdminToken(data.token);
        
        // Return the current token to confirm it was set
        return json({ 
            success: true, 
            token: getAdminToken()
        });
    } catch (error) {
        console.error('Error in POST admin-token:', error);
        return json({ 
            success: false,
            message: 'Server error'
        });
    }
};

// Clear the admin token
export const DELETE: RequestHandler = async () => {
    try {
        clearAdminToken();
        console.log('DELETE admin-token: Token cleared');
        return json({ success: true });
    } catch (error) {
        console.error('Error in DELETE admin-token:', error);
        return json({ success: false });
    }
};