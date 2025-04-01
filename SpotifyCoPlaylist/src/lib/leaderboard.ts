import type { SpotifyTrack } from "$lib/types";

export class LeaderboardState {
    private list: Array<{ track: SpotifyTrack, votes: number }> = [];
    private initialized: boolean = false;



    addToLeaderboard(item: SpotifyTrack){
        const existingTrack = this.list.find(entry => entry.track.id === item.id);
        if(existingTrack){
            existingTrack.votes += 1;
        } else {
            this.list.push({ track: item, votes: 1 });
        }
        return this.getStatus();
    }

    initialize() {
        this.initialized = true;
        return this.getStatus();
    }

    getStatus() {
        return {
            list: this.list,
            initialized: this.initialized
        };
    }

    removeFromLeaderboard(itemId: string){
        this.list = this.list.filter(entry => entry.track.id !== itemId);
        return this.getStatus();
    }

    incrementVotes(itemId: string){
        const existingTrack = this.list.find(entry => entry.track.id === itemId);
        if(existingTrack){
            existingTrack.votes ++;
        }
        return this.getStatus();
    }

    decrementVotes(itemId: string){
        const existingTrack = this.list.find(entry => entry.track.id === itemId);
        if(existingTrack){
            existingTrack.votes --;
        }
        return this.getStatus();
    }

    sortLeaderboard(){
        this.list = this.list.sort((a, b) => b.votes - a.votes);
        return this.getStatus();
    }
}

export const leaderboardState = new LeaderboardState();