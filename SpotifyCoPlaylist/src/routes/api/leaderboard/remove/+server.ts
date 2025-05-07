import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ( { request }) => {
    const { id } = await request.json();
    const status = await leaderboardState.removeFromLeaderboard(id);
    return json(status);
}