<script lang="ts">
    import { 
        searchForSong
    } from "$lib/script"
    import type { SpotifySearchResponse, SpotifyTrack } from '$lib/types';
    import { addToLeaderboard, getServerAdminToken } from "$lib/api";
    import { adminToken, refreshToken, tokenReady } from "$lib/adminTokenManager";
    import { onMount } from "svelte";
    import { hasVotedForTrack, recordVote } from "$lib/voteTracker"; // Import vote tracking functions

    let { onSongAdded } = $props<{
        onSongAdded?: (track: SpotifyTrack) => void
    }>();

    let searchResults = $state<SpotifySearchResponse | null>(null);
    let isSearching = $state(false);
    let searchError = $state<string | null>(null);

    let songSearch = $state({
        search: ""
    });


    // Ensure we have a token when component mounts
    onMount(async () => {
        // If token isn't ready, show a message and try to refresh
        if (!$adminToken) {
            console.log("AddSong: No token on mount - attempting refresh...");
            await refreshToken();
            
            // Wait for the token to be ready or timeout after a few tries
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!$adminToken && attempts < maxAttempts) {
                console.log(`AddSong: Waiting for token (attempt ${attempts + 1}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }
    });

    function closeSearch() {
        const closeButton = document.getElementById("close_search");
        if (closeButton) {
            closeButton.style.display = "none";
        }
        searchResults = null;
    }

    async function searchSongs() {
        searchError = null;
        isSearching = true;
        
        try {
            // If store token is not available, try to get it directly from server
            let token = $adminToken;
            if (!token) {
                console.log("AddSong: Store token not available, fetching from server directly");
                token = await getServerAdminToken();
                
                if (!token) {
                    searchError = "Cannot access Spotify API. Please try again later.";
                    console.error("AddSong: Unable to get admin token from any source");
                    return;
                }
            }

            searchResults = await searchForSong(token, songSearch.search);
            console.log("Search results:", searchResults);
        } catch (error) {
            console.error("Error searching for songs:", error);
            searchError = "Failed to search. Please try again.";
        } finally {
            isSearching = false;
        }
    }

    async function addSongToLeaderboard(track: SpotifyTrack) {
        try {

            // Record that the user has voted for this track (as adding is like upvoting)
            recordVote(track.id, 'increment');

            await addToLeaderboard(track);
            
            if (onSongAdded) {
                onSongAdded(track);
            }
        } catch (error) {
            recordVote(track.id, 'decrement'); // Rollback the vote if adding fails
            console.error("Error adding song to leaderboard:", error);
        }
    }
</script>

<div class="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
    {#if !$tokenReady}
        <p class="text-yellow-500 mb-4">Loading Spotify connection...</p>
    {/if}
    
    <!-- Title -->
    <h1 class="text-3xl font-bold mb-6 text-center">Add Song</h1>

    <!-- Search Input -->
    <div class="flex items-center space-x-2 mb-4">
        <input 
            bind:value={songSearch.search}
            type="text"
            onkeydown="{(e) => e.key === 'Enter' && searchSongs()}"
            placeholder="Search for a song..."
            class="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            onclick={searchSongs}
            disabled={isSearching}
        >
            {isSearching ? 'Searching...' : '🔍 Search'}
        </button>
    </div>

    {#if searchError}
        <p class="text-red-400 mb-4">{searchError}</p>
    {/if}

    <p class="text-gray-400 text-sm mb-4">Searching for: <span class="text-green-400">{songSearch.search}</span></p>

    <!-- Close Button -->
    {#if searchResults}
        <button 
            id="close_search"
            class="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105"
            onclick={closeSearch}
        >
            ❌ Close
        </button>

        <!-- Search Results -->
        <ul class="mt-6 space-y-4">
            {#each searchResults.tracks.items as track}
                {@const isAdded = hasVotedForTrack(track.id)}
                <li class="bg-gray-800 p-4 rounded-lg flex items-center space-x-4 shadow-md {isAdded ? 'border border-green-600' : ''}">
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
                        class="ml-auto bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 {isAdded ? 'opacity-50 cursor-not-allowed' : ''}"
                        onclick={() => addSongToLeaderboard(track)}
                        disabled={isAdded}
                    >
                        {isAdded ? '✓ Added' : '➕ Add'}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>