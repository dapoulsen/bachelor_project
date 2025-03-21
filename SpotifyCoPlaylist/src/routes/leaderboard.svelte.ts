import type { SpotifySearchResponse, SpotifyTrack } from "$lib/types";

export class Leaderboard {
    map = $state(new Map<string, {track: SpotifyTrack; votes : number} >());

    addToLeaderboard(item: SpotifyTrack){
        console.log(this.map);
        
        const existing = this.map.get(item.id);
        if(existing){
            existing.votes++;
        } else {
            this.map.set(item.id, {track: item, votes: 1});
        }

        console.log(this.map);
    }

    removeFromLeaderboard(item: SpotifyTrack){
        this.map.delete(item.id);
    }

    getVotes(item: SpotifyTrack){
        return this.map.get(item.id)?.votes || 0;
    }

    getLeaderboard(){
        return Array.from(this.map.values()).sort((a, b) => b.votes - a.votes);
    }

}