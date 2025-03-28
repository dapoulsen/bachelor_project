import { leaderboardState } from "$lib/leaderboard.svelte";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ( { request }) => {
    const {id, action } = await request.json();
    let status;

    if(action === 'increment'){
        status = leaderboardState.incrementVotes(id);
    } else if(action === 'decrement'){
        status = leaderboardState.decrementVotes(id);
    }

    return json(status);
}