import { leaderboardState } from "$lib/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { id, action } = await request.json();
        
        console.log(`Server received vote: ${action} for track ${id}`);
        
        let status;
        if (action === 'increment') {
            status = leaderboardState.incrementVotes(id);
            console.log('I am Incrementing');
        } else if (action === 'decrement') {
            status = leaderboardState.decrementVotes(id);
        } else {
            return new Response('Invalid action', { status: 400 });
        }
        
        leaderboardState.sortLeaderboard(); // Re-sort after voting
        return json(status);
    } catch (error) {
        console.error('Error in vote endpoint:', error);
        return new Response('Server error', { status: 500 });
    }
};