import type { SpotifyTrack } from "$lib/types";

export async function getLeaderboard() {
    const res = await fetch("api/leaderboard");
    return await res.json();
}

export async function initializeLeaderboard() {
    const res = await fetch("api/leaderboard", {
        method: "POST"
    });
    return await res.json();
}

export async function addToLeaderboard(track: SpotifyTrack) {
    const res = await fetch("api/leaderboard/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(track)
    });
    return await res.json();
}

export async function removeFromLeaderboard(trackId: string) {
    const res = await fetch("api/leaderboard/remove", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: trackId })
    });
    return await res.json();
}

export async function voteForTrack(trackId: string, action: 'increment' | 'decrement') {
    const res = await fetch("api/leaderboard/vote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: trackId, action })
    });
    return await res.json();
}