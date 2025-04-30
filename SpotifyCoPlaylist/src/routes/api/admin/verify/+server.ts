import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";

// Hardcoded password for now - in a real app, you would hash this and store it more securely
const ADMIN_PASSWORD = "bread";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { password } = await request.json();
        
        if (!password) {
            return json({ 
                success: false,
                message: 'No password provided'
            }, { status: 400 });
        }
        
        const isValid = password === ADMIN_PASSWORD;
        
        return json({ 
            success: isValid,
            message: isValid ? 'Password verified' : 'Invalid password'
        });
    } catch (error) {
        console.error('Error in password verification:', error);
        return json({ 
            success: false,
            message: 'Server error'
        }, { status: 500 });
    }
};