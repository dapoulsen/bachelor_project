<script lang="ts">
    import AddSong from "$lib/Components/addSong.svelte";
    import GenreAdd from "$lib/Components/genreAdd.svelte";
    import type { SpotifyTrack } from "$lib/types";
    import { onMount } from "svelte";
    import { getLeaderboard, voteForTrack, getSessionStatus, getSessionType } from "$lib/api";
    import UserCurrentlyPlaying from "$lib/Components/UserCurrentlyPlaying.svelte";
    import { adminToken } from "$lib/adminTokenManager";
    import { hasVotedForTrack, getUserVoteForTrack, clearVoteHistory } from "$lib/voteTracker";
    import { logUserAction } from "$lib/clientLogger";
    import { browser } from "$app/environment";
    // Import the new voting components
    import StandardVoting from "$lib/Components/StandardVoting.svelte";
    import GenreVoting from "$lib/Components/GenreVoting.svelte";
    
    interface LeaderboardItem {
        track: SpotifyTrack;
        votes: number;
    }
    
    let leaderboardState = $state({
        list: [] as LeaderboardItem[],
        initialized: false
    });

    let isRefreshing = $state(false);

    let userState = $state({
        state: 0
    });

    let sessionStatus = $state({
        isActive: false
    });

    let sessionType = $state('');

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
            let status = await getSessionStatus();
            if (status === 'active') {
                status = true;
            } else {
                status = false;
            }
            sessionStatus.isActive = status;
            sessionType = await getSessionType();
            console.log("Session type: ", sessionType);
            if (!sessionStatus.isActive) {
                clearVoteHistory(); // Clear vote history when session is active
            }
            console.log("Session status: ", sessionStatus.isActive);
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

    <!-- {#if !leaderboardState.initialized}
        <p class="text-gray-400">Loading...</p>
    {:else} -->

    {#if !sessionStatus.isActive}
        <p class="text-white-500 mt-4">Waiting for session to start...</p>
    {:else}
    <UserCurrentlyPlaying />
    
    <!-- Buttons -->
    <div class="flex space-x-4 mb-8">
        {#if userState.state === 0}
         <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-5 px-8 rounded-lg transition duration-300"
            onclick={() => setState(1)}
            id="add-button"
        >
            ➕ Add
        </button>   
        {:else}
        <!-- <button 
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-5 px-8 rounded-lg transition duration-300"
            onclick={() => setState(2)}
        >
            📊 Vote
        </button> -->
            <button 
                class="bg-red-500  hover:bg-red-600 text-white font-bold py-5 px-8 rounded-lg transition duration-300"
                onclick={() => setState(0)}
            >
                Close
            </button>
        {/if} 
    </div>

    <!-- Dynamic Content -->
    {#if userState.state === 1}
        {#if sessionType === 'normal'}
            <AddSong  onSongAdded={handleSongAdded}/>
        {:else if sessionType === 'genre'}
            <GenreAdd onSongAdded={handleSongAdded} />
        {/if}
    {/if}

    <!-- Leaderboard -->
    <h2 class="text-2xl font-semibold mt-8">Leaderboard</h2>
    
    {#if leaderboardState.list.length === 0}
        <p class="text-gray-400 mt-4">No songs in leaderboard</p>
    {:else}
        <ul class="mt-6 w-full max-w-3xl space-y-4">
            {#each leaderboardState.list as item}   
            {@const userVote = getUserVoteForTrack(item.track.id)}
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
                        {#if userVote}
                            <!-- Show what the user voted -->
                            <p class="text-sm text-gray-400 mb-3 text-center">
                                You voted: {userVote === 'increment' ? '⬆️ Up' : '⬇️ Down'}
                            </p>
                        {/if}
                        
                        <!-- Conditional rendering based on sessionType -->
                        {#if sessionType === 'genre'}
                            <GenreVoting track={item.track} {userId} refreshLeaderboard={refreshLeaderboard} />
                        {:else}
                            <StandardVoting track={item.track} {userId} refreshLeaderboard={refreshLeaderboard} />
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
    <!-- {/if} -->
    {/if}
</main> 



<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }


</style>