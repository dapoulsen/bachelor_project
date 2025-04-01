import { leaderboardState } from "$lib/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const status = leaderboardState.getStatus();
    leaderboardState.sortLeaderboard();
    return json(status);
}

export const POST: RequestHandler = async () => {
    const status = leaderboardState.initialize();
    return json(status);
}