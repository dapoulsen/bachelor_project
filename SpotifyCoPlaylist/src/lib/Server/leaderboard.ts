import type { SpotifyTrack } from "$lib/types";

export class LeaderboardState {
    private list: Array<{ track: SpotifyTrack, votes: number }> = [];
    private initialized: boolean = false;
    private operationInProgress = false; // Add mutex-like locking

    // Create a helper method for synchronized operations
    private async withLock<T>(operation: () => T): Promise<T> {
        // Wait until no operation is in progress
        while (this.operationInProgress) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        try {
            this.operationInProgress = true;
            return operation();
        } finally {
            this.operationInProgress = false;
        }
    }

    async addToLeaderboard(item: SpotifyTrack) {
        return this.withLock(() => {
            const existingTrack = this.list.find(entry => entry.track.id === item.id);
            if(existingTrack) {
                existingTrack.votes += 1;
            } else {
                this.list.push({ track: item, votes: 1 });
            }
            return this.getStatus();
        });
    }

    async initialize() {
        return this.withLock(() => {
            this.initialized = true;
            return this.getStatus();
        });
    }

    async reset() {
        return this.withLock(() => {
            this.list = [];
            this.initialized = false;
            return this.getStatus();
        });
    }

    getStatus() {
        return {
            list: this.list,
            initialized: this.initialized
        };
    }

    async removeFromLeaderboard(itemId: string) {
        return this.withLock(() => {
            this.list = this.list.filter(entry => entry.track.id !== itemId);
            return this.getStatus();
        });
    }

    async incrementVotes(itemId: string) {
        return this.withLock(() => {
            const existingTrack = this.list.find(entry => entry.track.id === itemId);
            if(existingTrack) {
                existingTrack.votes++;
            }
            return this.getStatus();
        });
    }

    async decrementVotes(itemId: string) {
        return this.withLock(() => {
            const existingTrack = this.list.find(entry => entry.track.id === itemId);
            if(existingTrack) {
                existingTrack.votes--;
            }
            return this.getStatus();
        });
    }

    async sortLeaderboard() {
        return this.withLock(() => {
            this.list = this.list.sort((a, b) => b.votes - a.votes);
            return this.getStatus();
        });
    }
}

export const leaderboardState = new LeaderboardState();