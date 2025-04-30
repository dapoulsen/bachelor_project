import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { id, action } = await request.json();
        
        let result;
        if (action === 'increment') {
            result = await leaderboardState.incrementVotes(id);
        } else if (action === 'decrement') {
            result = await leaderboardState.decrementVotes(id);
        } else {
            return new Response('Invalid action', { status: 400 });
        }
        
        // Now sort after the vote operation is complete
        await leaderboardState.sortLeaderboard();
        return json(result);
    } catch (error) {
        console.error('Error in vote endpoint:', error);
        return new Response('Server error', { status: 500 });
    }
};