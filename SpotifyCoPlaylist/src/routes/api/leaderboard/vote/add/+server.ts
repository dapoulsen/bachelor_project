import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { trackId, votes } = await request.json();
        const result = await leaderboardState.addVotesToTrack(trackId, votes);
        // Now sort after the vote operation is complete
        await leaderboardState.sortLeaderboard();
        return json(result);
    } catch (error) {
        console.error('Error in vote endpoint:', error);
        return new Response('Server error', { status: 500 });
    }
}