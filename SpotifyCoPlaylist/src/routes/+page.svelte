<script lang="ts">
    import AddSong from "$lib/Components/addSong.svelte";
    import LastFm from "$lib/Components/lastFm.svelte";
    import type { SpotifyTrack } from "$lib/types";
    import { onMount } from "svelte";
    import { getLeaderboard, voteForTrack, getSessionStatus } from "$lib/api";
    import UserCurrentlyPlaying from "$lib/Components/UserCurrentlyPlaying.svelte";
    import { adminToken } from "$lib/adminTokenManager"; // Import the admin token manager
    import { hasVotedForTrack, recordVote, getUserVoteForTrack, clearVoteHistory } from "$lib/voteTracker"; // Add this import
    import { logUserAction } from "$lib/clientLogger";
    import { browser } from "$app/environment";
    
    interface LeaderboardItem {
        track: SpotifyTrack;
        votes: number;
    }
    
    let leaderboardState = $state({
        list: [] as LeaderboardItem[],
        initialized: false
    });

    let isRefreshing = false;

    let userState = $state({
        state: 0
    });

    let sessionStatus = $state({
        isActive: false
    });

    let userId = $state<string | null>(null);

    async function refreshLeaderboard() {
        if (isRefreshing) return; // Prevent multiple simultaneous refreshes
        
        try {
            isRefreshing = true;
            const data = await getLeaderboard();
            console.log("Refreshed leaderboard data:", data);
            leaderboardState = data;
        } catch (error) {
            console.error("Error refreshing leaderboard:", error);
        } finally {
            isRefreshing = false;
        }
    }

    async function updateSessionStatus()  {
        try {
            const status = await getSessionStatus();
            sessionStatus.isActive = status;
            if (!sessionStatus.isActive) {
                clearVoteHistory(); // Clear vote history when session is active
            }
        } catch (error) {
            console.error("Error fetching session status:", error);
        }
    };

    onMount(() => {
        let interval: ReturnType<typeof setInterval>;

        if (browser) {
            // Use a stored user ID or generate a new one
            userId = localStorage.getItem('spotify_coplaylist_user_id');
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('spotify_coplaylist_user_id', userId);
            }
        }

        refreshLeaderboard();
        
        updateSessionStatus();

        // Setup interval for regular refreshes
        interval = setInterval(async () => {
            await refreshLeaderboard();
            await updateSessionStatus();
        }, 5000);
        
        // Return the cleanup function directly
        return () => {
            if (interval) clearInterval(interval);
        };
    });

    function setState(newState: number) {
        const oldState = userState.state;
        userState.state = newState;
        
        // Log the state change action
        if (userId) {
            logUserAction(userId, 'change_view', { 
                from: oldState, 
                to: newState,
                viewName: newState === 0 ? 'main' : newState === 1 ? 'add_song' : 'vote'
            });
        }
    }

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
            
            // Optimistically update UI
            const tempId = `voting-${track.id}-${Date.now()}`;
            
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
    
    // Use the debounced function in your component
    async function handleVote(track: SpotifyTrack, action: 'increment' | 'decrement') {
        // Log the vote action
        if (userId) {
            logUserAction(userId, 'vote', { 
                trackId: track.id,
                trackName: track.name,
                voteType: action 
            });
        }
        
        debouncedVote(track, action);
    }
        

    async function handleSongAdded(track:SpotifyTrack) {
        console.log("Song added:", track.name);
        
        // Log the add song action
        if (userId) {
            logUserAction(userId, 'add_song', { 
                trackId: track.id,
                trackName: track.name 
            });
        }
        
        await refreshLeaderboard();
    }
    
    
</script>


<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    <!-- Header -->
    <h1 class="text-4xl font-bold mb-6"> Music Leaderboard</h1>

    {#if !leaderboardState.initialized}
        <p class="text-gray-400">Loading...</p>
    {:else}

    {#if sessionStatus.isActive}

    <UserCurrentlyPlaying />
    
    <!-- Buttons -->
    <div class="flex space-x-4 mb-8">
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-5 px-8 rounded-lg transition duration-300"
            onclick={() => setState(1)}
        >
            ➕ Add
        </button>
        <button 
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-5 px-8 rounded-lg transition duration-300"
            onclick={() => setState(2)}
        >
            📊 Vote
        </button>
        {#if userState.state !== 0}
            <button 
                class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                onclick={() => setState(0)}
            >
                Cancel
            </button>
        {/if}
    </div>

    <!-- Dynamic Content -->
    {#if userState.state === 1}
        <!-- <AddSong  onSongAdded={handleSongAdded}/> -->
         <LastFm onSongAdded={handleSongAdded} />
    {/if}

    <!-- Leaderboard -->
    <h2 class="text-2xl font-semibold mt-8">Leaderboard</h2>
    
    {#if leaderboardState.list.length === 0}
        <p class="text-gray-400 mt-4">No songs in leaderboard</p>
    {:else}
        <ul class="mt-6 w-full max-w-3xl space-y-4">
            {#each leaderboardState.list as item}
                <li class="bg-gray-800 p-4 rounded-lg flex flex-col items-center sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shadow-md {hasVotedForTrack(item.track.id) ? 'border border-gray-600' : ''}">
                    <img 
                        src={item.track.album.images[0]?.url} 
                        alt={item.track.album.name} 
                        class="w-16 h-16 rounded-lg"
                    />
                    <div class="flex-1 text-center sm:text-left">
                        <p class="text-lg font-semibold">{item.track.name}</p>
                        <p class="text-gray-400">{item.track.artists.map(artist => artist.name).join(", ")}</p>
                    </div>
                    <div class="flex flex-col items-center w-full sm:w-auto sm:items-end">
                        <p class="text-center mb-3">Votes: {item.votes}</p>
                        {#if userState.state === 2}
                            {@const userVote = getUserVoteForTrack(item.track.id)}
                            {#if userVote}
                                <!-- Show what the user voted -->
                                <p class="text-sm text-gray-400 mb-3 text-center">
                                    You voted: {userVote === 'increment' ? '⬆️ Up' : '⬇️ Down'}
                                </p>
                            {/if}
                            <div class="flex space-x-4 justify-center w-full">
                                <button 
                                    id="vote-button-yes"
                                    class="bg-green-500 hover:bg-green-400 text-white font-bold py-3 sm:py-2 px-5 sm:px-4 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300 text-base sm:text-sm {userVote ? 'opacity-50 cursor-not-allowed' : ''} w-35 sm:w-auto"
                                    onclick={() => handleVote(item.track, 'increment')}
                                    disabled={!!userVote}
                                >
                                    <span>Upvote</span>
                                </button>
                            
                                <button 
                                    id="vote-button-no"
                                    class="bg-red-500 hover:bg-red-400 text-white font-bold py-3 sm:py-2 px-5 sm:px-4 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 text-base sm:text-sm {userVote ? 'opacity-50 cursor-not-allowed' : ''} w-35 sm:w-auto"
                                    onclick={() => handleVote(item.track, 'decrement')}
                                    disabled={!!userVote}
                                >
                                    <span>Downvote</span>
                                </button>
                            </div>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
    {:else}
        <p class="text-white mt-4">Waiting for session to start</p>
    {/if}
    {/if}
</main> 



<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }


</style>