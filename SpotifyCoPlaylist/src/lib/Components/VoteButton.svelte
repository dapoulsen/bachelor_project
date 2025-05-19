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
    
    const isUpvote = action === 'increment';
    const buttonClass = isUpvote 
        ? "bg-green-500 hover:bg-green-400 focus:ring-green-300" 
        : "bg-red-500 hover:bg-red-400 focus:ring-red-300";
    const buttonLabel = isUpvote ? 'Upvote' : 'Downvote';
</script>

<button 
    id="vote-button-{isUpvote ? 'yes' : 'no'}"
    class="{buttonClass} text-white font-bold py-3 sm:py-2 px-5 sm:px-4 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 text-base sm:text-sm {(userVote || disabled) ? 'opacity-50 cursor-not-allowed' : ''} w-35 sm:w-auto"
    on:click={onClick}
    disabled={!!userVote || disabled}
>
    <span>{buttonLabel}</span>
</button>