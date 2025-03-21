import type { SpotifyTrack } from "$lib/types";

export class Leaderboard {
    list = $state([] as SpotifyTrack[]);

    addToLeaderboard(item: SpotifyTrack){
        if(this.list.includes(item)){
            return;
        }
        this.list.push(item);
    }

    removeFromLeaderboard(item: SpotifyTrack){
        this.list = this.list.filter(track => track !== item);
    }

}