import { leaderboardState } from "$lib/Server/leaderboard";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async () => {
    const status = leaderboardState.reset();
    return json(status);
}