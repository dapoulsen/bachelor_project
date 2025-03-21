import type { SpotifySearchResponse, SpotifyTrack } from "$lib/types";

export class Leaderboard {
    map = $state(new Map<SpotifyTrack, number>());

    addToLeaderboard(item: SpotifyTrack){
        this.map.set(item, 1);
    }

    removeFromLeaderboard(item: SpotifyTrack){
        this.map.delete(item);
    }
}