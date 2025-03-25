<script lang="ts">
    import SpotifyAuth from "./spotifyAuth.svelte";
    import AddSong from "./addSong.svelte";
    import Cookies from "js-cookie";
    import {Leaderboard} from "./leaderboard.svelte.ts";
    
    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let leaderboard = new Leaderboard();

    let userState = $state({
        state: 0
    });

    function setState(newState: number) {
        userState.state = newState;
    }

    $effect(() => {
        leaderboard.list.sort((a, b) => b.votes - a.votes);
        console.log("HEYO");
    })
    
</script>

<SpotifyAuth />

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    <!-- Header -->
    <h1 class="text-4xl font-bold mb-6"> Music Leaderboard</h1>

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
        <AddSong leaderboard={leaderboard} />
    <!-- {:else if userState.state === 2} -->
    {/if}

    <!-- Leaderboard -->
    <h2 class="text-2xl font-semibold mt-8">Leaderboard</h2>
    {#if leaderboard.list.length === 0}
        <p class="text-gray-400 mt-4">No songs in leaderboard</p>
    {:else}
        <ul class="mt-6 w-full max-w-3xl space-y-4">
            {#each leaderboard.list as item}
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
                                onclick={() => leaderboard.incrementVotes(item.track)}
                                >
                                    ⬆️ <span>Upvote</span>
                            </button>
                        
                            <button 
                                id="vote-button-no"
                                class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-5 rounded shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 space-x-2"
                                onclick={() => leaderboard.decrementVotes(item.track)}
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
</main> 



<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }
    
    :global(p), 
    :global(h1), 
    :global(h2), 
    :global(h3), 
    :global(h4), 
    :global(h5), 
    :global(h6) {
        color: #ddd5d5;
    }

</style>