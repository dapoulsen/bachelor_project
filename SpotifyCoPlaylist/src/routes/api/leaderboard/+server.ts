import { leaderboardState } from "$lib/leaderboard.svelte";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const status = leaderboardState.getStatus();
    return json(status);
}

export const POST: RequestHandler = async () => {
    const status = leaderboardState.initialize();
    return json(status);
}