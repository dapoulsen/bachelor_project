import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const status = await leaderboardState.getStatus();
    await leaderboardState.sortLeaderboard();
    console.log(json(status));
    return json(status);
}

export const POST: RequestHandler = async () => {
    const status = await leaderboardState.initialize();
    return json(status);
}