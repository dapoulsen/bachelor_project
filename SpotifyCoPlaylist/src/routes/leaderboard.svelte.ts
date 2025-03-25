import type { SpotifyTrack } from "$lib/types";

export class Leaderboard {
    list = $state<Array<{ track: SpotifyTrack, votes: number }>>([]);

    addToLeaderboard(item: SpotifyTrack){
        const existingTrack = this.list.find(entry => entry.track.id === item.id);
        if(existingTrack){
            existingTrack.votes += 1;
            return;
        }
        this.list.push({ track: item, votes: 1 });
    }

    removeFromLeaderboard(item: SpotifyTrack){
        this.list = this.list.filter(entry => entry.track.id !== item.id);
    }

    incrementVotes(item: SpotifyTrack){
        const existingTrack = this.list.find(entry => entry.track.id === item.id);
        if(existingTrack){
            existingTrack.votes ++;
        }
    }

    decrementVotes(item: SpotifyTrack){
        const existingTrack = this.list.find(entry => entry.track.id === item.id);
        if(existingTrack){
            existingTrack.votes --;
        }
    }

    

}