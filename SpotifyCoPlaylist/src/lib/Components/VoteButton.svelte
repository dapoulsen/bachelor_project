<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";

    const { 
        track, 
        action, 
        userVote, 
        onClick, 
        disabled = false 
    } = $props<{
        track: SpotifyTrack;
        action: 'increment' | 'decrement';
        userVote: 'increment' | 'decrement' | null;
        onClick: () => void;
        disabled?: boolean;
    }>();

    // Check if the user has already voted for this track
    const hasVoted = userVote !== null;
    
    // Determine if this button should be active based on the user's vote
    const isActiveVote = userVote === action;
    
    const isUpvote = action === 'increment';
    
    // Enhance button styling to show active state
    const buttonClass = isUpvote 
        ? `bg-green-500 hover:bg-green-400 focus:ring-green-300 ${isActiveVote ? 'ring-2 ring-white' : ''}` 
        : `bg-red-500 hover:bg-red-400 focus:ring-red-300 ${isActiveVote ? 'ring-2 ring-white' : ''}`;
    
    const buttonLabel = isUpvote ? 'Upvote' : 'Downvote';
    
    // Button should be disabled if user has voted or if disabled prop is true
    const isDisabled = hasVoted || disabled;
</script>

<button 
    id="vote-button-{isUpvote ? 'yes' : 'no'}"
    class="{buttonClass} text-white font-bold py-3 sm:py-2 px-5 sm:px-4 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 text-base sm:text-sm {isDisabled ? 'opacity-50 cursor-not-allowed' : ''} w-35 sm:w-auto"
    onclick={onClick}
    disabled={isDisabled}
>
    <span>{buttonLabel}{isActiveVote ? ' ✓' : ''}</span>
</button>