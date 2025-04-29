<script lang="ts">
    import AddSong from "$lib/Components/addSong.svelte";
    import type { SpotifyTrack } from "$lib/types.js";
    import { queueSelectedSong } from "$lib/script"
    import { onMount } from "svelte";
    import { getLeaderboard, voteForTrack, removeFromLeaderboard } from "$lib/api";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { adminToken } from "$lib/adminTokenManager"; // Import the admin token manager
    
    interface LeaderboardItem {
        track: SpotifyTrack;
        votes: number;
    }
    
    let leaderboardState = $state({
        list: [] as LeaderboardItem[],
        initialized: false
    });

    // let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
    

    let userState = $state({
        state: 0
    });

    async function refreshLeaderboard() {
        try {
            const data = await getLeaderboard();
            console.log("Refreshed leaderboard data:", data);
            leaderboardState = data;
        } catch (error) {
            console.error("Error refreshing leaderboard:", error);
        }
    }


    onMount(() => {
        let interval: ReturnType<typeof setInterval>;

        refreshLeaderboard();

        interval = setInterval(refreshLeaderboard, 5000);
        
        // Return the cleanup function directly
        return () => {
            if (interval) clearInterval(interval);
        };
    });

    function setState(newState: number) {
        userState.state = newState;
    }

    async function queueSong() {
        if (leaderboardState.list.length > 0) { // FIXED: Check if list is NOT empty
            try {

                if (!$adminToken) {
                    console.error("Admin token is not set. Cannot queue song.");
                    return;
                }

                let track = leaderboardState.list[0].track;
                console.log("Queueing song:", track.name);
                await queueSelectedSong(track, $adminToken);
                await removeFromLeaderboard(track.id);
                await refreshLeaderboard();
            } catch (error) {
                console.error("Error queueing song:", error);
            }
        } else {
            console.log("No songs in leaderboard to queue");
        }
    }

    async function handleVote(track: SpotifyTrack, action: 'increment' | 'decrement') {
    try {
        console.log(`Voting ${action} for track ${track.id}`);
        const result = await voteForTrack(track.id, action);
        console.log('Vote result:', result);
        await refreshLeaderboard();
    } catch (error) {
        console.error('Error in handleVote:', error);
    }
}
        

    async function handleSongAdded(track:SpotifyTrack) {
        console.log("Song added:", track.name);
        await refreshLeaderboard();
    }
    
    
</script>



<!-- <SpotifyAuth /> -->


<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    <!-- Header -->
    <h1 class="text-4xl font-bold mb-6"> Music Leaderboard</h1>

    {#if !leaderboardState.initialized}
        <p class="text-gray-400">Loading...</p>
    {:else}

    <CurrentlyPlaying />
    
    <!-- Buttons -->
    <div class="flex space-x-4 mb-8">
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onclick={() => setState(1)}
        >
            ➕ Tilføj
        </button>
        <button 
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onclick={() => setState(2)}
        >
            📊 Stem
        </button>
    </div>

    <!-- Dynamic Content -->
    {#if userState.state === 1}
        <AddSong  onSongAdded={handleSongAdded}/>
    {/if}

    <!-- Leaderboard -->
    <h2 class="text-2xl font-semibold mt-8">Leaderboard</h2>
    <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300" 
        onclick={queueSong}>ADD SONG TO QUEUE
    </button>
    {#if leaderboardState.list.length === 0}
        <p class="text-gray-400 mt-4">No songs in leaderboard</p>
    {:else}
        <ul class="mt-6 w-full max-w-3xl space-y-4">
            {#each leaderboardState.list as item}
                <li class="bg-gray-800 p-4 rounded-lg flex items-center space-x-4 shadow-md">
                    <img 
                        src={item.track.album.images[0]?.url} 
                        alt={item.track.album.name} 
                        class="w-16 h-16 rounded-lg"
                    />
                    <div>
                        <p class="text-lg font-semibold">{item.track.name}</p>
                        <p class="text-gray-400">{item.track.artists.map(artist => artist.name).join(", ")}</p>
                    </div>
                    <div>
                        <p>Votes: {item.votes}</p>
                        {#if userState.state === 2}
                        <div class=inline-flex>
                            <button 
                                id="vote-button-yes"
                                class="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-5 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300 space-x-2"
                                onclick={() => handleVote(item.track, 'increment')}
                                >
                                    ⬆️ <span>Upvote</span>
                            </button>
                        
                            <button 
                                id="vote-button-no"
                                class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-5 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 space-x-2"
                                onclick={() => handleVote(item.track, 'decrement')}
                                >
                                ⬇️ <span>Downvote</span>
                            </button>
                        </div>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}

    {/if}
</main> 



<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }


</style>