<script lang="ts">
    import { 
        searchForSong
    } from "$lib/script"
    import type { SpotifySearchResponse, SpotifyTrack } from '$lib/types';
    import Cookies from "js-cookie";
    import { addToLeaderboard } from "$lib/api";
    import { leaderboardState } from "$lib/leaderboard.svelte";


    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
    let searchResults = $state<SpotifySearchResponse | null>(null);

    let songSearch = $state({
        search: ""
    });

    function closeSearch() {
        // hide close button
        const closeButton = document.getElementById("close_search");
        if (closeButton) {
            closeButton.style.display = "none";
        }
        searchResults = null;
    }

    async function searchSongs() {
        searchResults = await searchForSong(accessToken, songSearch.search);
    }

    async function addSongToLeaderboard(track: SpotifyTrack) {
        await addToLeaderboard(track);
    }
    
</script>



<div class="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
    <!-- Title -->
    <h1 class="text-3xl font-bold mb-6 text-center">Add Song</h1>

    <!-- Search Input -->
    <div class="flex items-center space-x-2 mb-4">
        <input 
            bind:value={songSearch.search}
            type="text"
            placeholder="Search for a song..."
            class="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            onclick={searchSongs}
        >
            🔍 Search
        </button>
    </div>

    <p class="text-gray-400 text-sm mb-4">Searching for: <span class="text-green-400">{songSearch.search}</span></p>

    <!-- Close Button -->
    {#if searchResults}
        <button 
            class="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            onclick={closeSearch}
        >
            ❌ Close
        </button>

        <!-- Search Results -->
        <ul class="mt-6 space-y-4">
            {#each searchResults.tracks.items as track}
                <li class="bg-gray-800 p-4 rounded-lg flex items-center space-x-4 shadow-md">
                    <img 
                        src={track.album.images[0]?.url} 
                        alt={track.album.name} 
                        class="w-16 h-16 rounded-lg"
                    />
                    <div>
                        <p class="text-lg font-semibold">{track.name}</p>
                        <p class="text-gray-400">{track.artists.map(artist => artist.name).join(", ")}</p>
                        <p class="text-sm text-gray-500">{track.album.name}</p>
                    </div>
                    <button 
                        class="ml-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
                        onclick={() => leaderboardState.addToLeaderboard({...track, votes: 1})}
                    >
                        ➕ Add
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>