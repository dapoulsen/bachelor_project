<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";
    import { hasVotedForTrack, recordVote, getUserVoteForTrack } from "$lib/voteTracker";
    import { voteForTrack } from "$lib/api";
    import { logUserAction } from "$lib/clientLogger";
    import VoteButton from "./VoteButton.svelte";

    export let track: SpotifyTrack;
    export let userId: string | null;
    export let refreshLeaderboard: () => Promise<void>;

    const userVote = getUserVoteForTrack(track.id);

    // Add debounce utility
    function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        
        return (...args: Parameters<F>) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    
    // Create debounced version of handleVote
    const debouncedVote = debounce(async (track: SpotifyTrack, action: 'increment' | 'decrement') => {
        try {
            // Check if user already voted for this track
            if (hasVotedForTrack(track.id)) {
                console.log(`User already voted for track ${track.id}`);
                return;
            }
            
            console.log(`Voting ${action} for track ${track.id}`);
            const result = await voteForTrack(track.id, action);
            
            if (result) {
                recordVote(track.id, action);
                console.log('Vote recorded locally');
                await refreshLeaderboard();
            }
        } catch (error) {
            console.error('Error in handleVote:', error);
        }
    }, 300); // 300ms debounce
    
    // Handle vote actions
    function handleUpvote() {
        // Log the vote action
        if (userId) {
            logUserAction(userId, 'vote', { 
                trackId: track.id,
                trackName: track.name,
                voteType: 'increment' 
            });
        }
        
        debouncedVote(track, 'increment');
    }
    
    function handleDownvote() {
        // Log the vote action
        if (userId) {
            logUserAction(userId, 'vote', { 
                trackId: track.id,
                trackName: track.name,
                voteType: 'decrement' 
            });
        }
        
        debouncedVote(track, 'decrement');
    }
</script>

<div class="flex space-x-4 justify-center w-full">
    <VoteButton track={track} action="increment" userVote={userVote} onClick={handleUpvote} />
    <VoteButton track={track} action="decrement" userVote={userVote} onClick={handleDownvote} />
</div>