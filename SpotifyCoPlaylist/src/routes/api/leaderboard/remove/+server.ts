import { leaderboardState } from "$lib/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ( { request }) => {
    const { id } = await request.json();
    const status = leaderboardState.removeFromLeaderboard(id);
    return json(status);
}