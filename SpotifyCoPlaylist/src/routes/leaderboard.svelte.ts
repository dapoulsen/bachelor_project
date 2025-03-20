import type { SpotifySearchResponse, SpotifyTrack } from "$lib/types";

export class Leaderboard {
    list = $state<SpotifyTrack[]>([]);

    addToList(item: SpotifyTrack){
        this.list = [...this.list, item];
    }

    removeFromList(item: SpotifyTrack){
        this.list = this.list.filter((i) => i.id !== item.id);
    }
}