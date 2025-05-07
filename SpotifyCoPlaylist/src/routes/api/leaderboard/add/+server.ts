import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ( { request }) => {
    const track = await request.json();
    const status = await leaderboardState.addToLeaderboard(track);
    await leaderboardState.sortLeaderboard();
    return json(status);
}