<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";
    import { hasVotedForTrack, recordVote, getUserVoteForTrack } from "$lib/voteTracker";
    import { voteForTrack } from "$lib/api";
    import { logUserAction } from "$lib/clientLogger";
    import VoteButton from "./VoteButton.svelte";

    const { track, userId, refreshLeaderboard } = $props<{
        track: SpotifyTrack;
        userId: string | null;
        refreshLeaderboard: () => Promise<void>;
    }>();

    const userVote = getUserVoteForTrack(track.id);

    let processingVote = $state(false);

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
            
            processingVote = true;
            
            console.log(`Voting ${action} for track ${track.id}`);
            const result = await voteForTrack(track.id, action);
            
            if (result) {
                recordVote(track.id, action);
                console.log('Vote recorded locally');
                await refreshLeaderboard();
            }
        } catch (error) {
            console.error('Error in handleVote:', error);
        } finally {
            processingVote = false;
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

<div class="flex flex-col items-center w-full mb-2">
    {#if processingVote}
        <div class="text-sm text-yellow-400 font-medium animate-pulse">
            Voting...
        </div>
    {/if}
</div>

<div class="flex space-x-4 justify-center w-full">
    <VoteButton track={track} action="increment" userVote={userVote} onClick={handleUpvote} disabled={processingVote} />
    <VoteButton track={track} action="decrement" userVote={userVote} onClick={handleDownvote} disabled={processingVote} />
</div>