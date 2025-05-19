<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";

    export let track: SpotifyTrack;
    export let action: 'increment' | 'decrement';
    export let userVote: 'increment' | 'decrement' | null;
    export let onClick: () => void;
    
    const isUpvote = action === 'increment';
    const buttonClass = isUpvote 
        ? "bg-green-500 hover:bg-green-400 focus:ring-green-300" 
        : "bg-red-500 hover:bg-red-400 focus:ring-red-300";
    const buttonLabel = isUpvote ? 'Upvote' : 'Downvote';
</script>

<button 
    id="vote-button-{isUpvote ? 'yes' : 'no'}"
    class="{buttonClass} text-white font-bold py-3 sm:py-2 px-5 sm:px-4 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 text-base sm:text-sm {userVote ? 'opacity-50 cursor-not-allowed' : ''} w-35 sm:w-auto"
    on:click={onClick}
    disabled={!!userVote}
>
    <span>{buttonLabel}</span>
</button>