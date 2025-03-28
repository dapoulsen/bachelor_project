import { leaderboardState } from "$lib/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ( { request }) => {
    const track = await request.json();
    const status = leaderboardState.addToLeaderboard(track);
    return json(status);
}