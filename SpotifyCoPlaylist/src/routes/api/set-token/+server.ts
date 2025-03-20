import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { accessToken } = await request.json();

        if (!accessToken) {
            return new Response(JSON.stringify({ error: "No access token provided" }), { status: 400 });
        }

        // Set cookie for authentication
        cookies.set("accessToken", accessToken, {
            httpOnly: true, // Prevent client-side JavaScript access
            secure: process.env.NODE_ENV === "production", // Secure in production
            path: "/", // Available on all pages
            maxAge: 3600 // Expire in 1 hour
        });

        return new Response(JSON.stringify({ message: "Access token stored successfully" }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to store access token" }), { status: 500 });
    }
};
