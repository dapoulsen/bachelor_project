import { leaderboardState } from "$lib/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { id, action } = await request.json();
        
        
        
        if (action === 'increment') {
            leaderboardState.incrementVotes(id);
            console.log('I am Incrementing');
        } else if (action === 'decrement') {
            leaderboardState.decrementVotes(id);
        } else {
            return new Response('Invalid action', { status: 400 });
        }
        
        leaderboardState.sortLeaderboard(); // Re-sort after voting
        return json(leaderboardState.getStatus());
    } catch (error) {
        console.error('Error in vote endpoint:', error);
        return new Response('Server error', { status: 500 });
    }
};