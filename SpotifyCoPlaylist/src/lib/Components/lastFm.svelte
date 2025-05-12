<script lang=ts>
    import { getLastFmToken, getLastFmSimilarTrack, getSimilarTracksInfo, searchForTrackLastFm } from "$lib/lastFmApi";
    import { searchForSong } from "$lib/script";
    import { addToLeaderboard } from "$lib/api";
    import { adminToken } from "$lib/adminTokenManager";
    import { recordVote } from "$lib/voteTracker";
    import type { SpotifyTrack } from "$lib/types";
    
    const lastFmToken = getLastFmToken();
    
    const { onSongAdded = (track: SpotifyTrack) => {} } = $props<{
        onSongAdded?: (track: SpotifyTrack) => void;
    }>();
    
    let searchQuery = $state("");
    let searchResults = $state<any[]>([]);
    let isSearching = $state(false);
    let searchError = $state<string | null>(null);
    let processingTrack = $state<string | null>(null);
    let addedTracks = $state<string[]>([]);

    async function searchLastFm() {
        if (!searchQuery.trim()) {
            searchError = "Please enter a search term";
            return;
        }
        
        searchError = null;
        isSearching = true;
        
        try {
            const response = await searchForTrackLastFm(searchQuery);
            searchResults = response.results.trackmatches.track;
            
            if (searchResults.length === 0) {
                searchError = "No tracks found for your search";
            }
        } catch (error) {
            console.error("Error searching Last.fm:", error);
            searchError = "Failed to search for tracks. Please try again.";
        } finally {
            isSearching = false;
        }
    }

    async function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            await searchLastFm();
        }
    }

    async function addTrackAndSimilar(track: any) {
        if (!$adminToken) {
            searchError = "Not connected to Spotify API";
            return;
        }
        
        processingTrack = track.name;
        searchError = null;
        
        try {
            // First, find the selected track in Spotify
            const spotifySearchResponse = await searchForSong($adminToken, `${track.name} ${track.artist}`);
            
            if (!spotifySearchResponse || spotifySearchResponse.tracks.items.length === 0) {
                throw new Error(`Could not find "${track.name}" on Spotify`);
            }
            
            // Get the main track
            const mainTrack = spotifySearchResponse.tracks.items[0];
            
            // Record the track as being processed to prevent duplicate adds
            addedTracks = [...addedTracks, mainTrack.id];
            
            // Add the main track to the leaderboard
            await addToLeaderboard(mainTrack);
            recordVote(mainTrack.id, 'increment');
            
            // Notify parent component
            onSongAdded(mainTrack);
            
            // Get similar tracks from Last.fm
            const similarTracksResponse = await getLastFmSimilarTrack(track.name, track.artist);
            
            // Check if we have any similar tracks
            if (!similarTracksResponse?.similartracks?.track || 
                !Array.isArray(similarTracksResponse.similartracks.track) || 
                similarTracksResponse.similartracks.track.length === 0) {
                
                // We successfully added the main track but no similar tracks found
                searchError = `Added "${track.name}" but no similar tracks were found for this song`;
                return;
            }
            
            const similarTracks = getSimilarTracksInfo(similarTracksResponse);
            
            // Add up to 2 similar tracks that aren't already in the list
            let addedSimilarCount = 0;
            
            for (const similarTrack of similarTracks) {
                if (addedSimilarCount >= 2) break;
                
                // Don't add tracks that are too similar in name to the main track
                if (similarTrack.name.toLowerCase() === track.name.toLowerCase()) continue;
                
                // Search for the similar track on Spotify
                const similarSpotifySearchResponse = await searchForSong(
                    $adminToken, 
                    `${similarTrack.name} ${similarTrack.artist}`
                );
                
                if (similarSpotifySearchResponse?.tracks.items.length > 0) {
                    const similarSpotifyTrack = similarSpotifySearchResponse.tracks.items[0];
                    
                    // Skip if we've already added this track
                    if (addedTracks.includes(similarSpotifyTrack.id)) continue;
                    
                    // Add to our tracking list
                    addedTracks = [...addedTracks, similarSpotifyTrack.id];
                    
                    // Add to leaderboard without a vote
                    await addToLeaderboard(similarSpotifyTrack);
                    
                    // Notify parent component
                    onSongAdded(similarSpotifyTrack);
                    
                    addedSimilarCount++;
                }
            }
            
            // If we went through all similar tracks but couldn't add any
            if (addedSimilarCount === 0) {
                searchError = `Added "${track.name}" but couldn't find any similar tracks on Spotify`;
            }
            
        } catch (error: unknown) {
            console.error("Error adding tracks:", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            searchError = `Failed to add "${track.name}": ${errorMessage}`;
        } finally {
            processingTrack = null;
        }
    }
    
    function closeSearch() {
        searchResults = [];
        searchQuery = "";
    }
</script>

<div class="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold mb-6 text-center">Search with Last.fm</h1>
    
    <div class="mb-4 text-sm text-gray-400">
        Find tracks on Last.fm and add them plus similar songs to the leaderboard
    </div>
    
    <!-- Search Input -->
    <div class="flex items-center space-x-2 mb-4">
        <input 
            bind:value={searchQuery}
            type="text"
            onkeydown={handleKeyDown}
            placeholder="Search for a song on Last.fm..."
            class="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isSearching}
        />
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            onclick={searchLastFm}
            disabled={isSearching}
        >
            {isSearching ? 'Searching...' : '🔍 Search'}
        </button>
    </div>
    
    {#if searchError}
        <p class="text-red-400 mb-4">{searchError}</p>
    {/if}
    
    {#if searchResults.length > 0}
        <button 
            class="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 mb-4"
            onclick={closeSearch}
        >
            ❌ Close Results
        </button>
        
        <ul class="mt-4 space-y-4">
            {#each searchResults as track}
                <li class="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shadow-md">
                    {#if track.image && track.image.length > 0}
                        <img 
                            src={track.image.find((img: { size: string; }) => img.size === "large")?.["#text"] || track.image[0]["#text"]} 
                            alt={track.name} 
                            class="w-16 h-16 rounded-lg"
                        />
                    {:else}
                        <div class="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                            <span class="text-2xl">🎵</span>
                        </div>
                    {/if}
                    <div class="flex-1">
                        <p class="text-lg font-semibold">{track.name}</p>
                        <p class="text-gray-400">{track.artist}</p>
                        <p class="text-sm text-gray-500">Listeners: {track.listeners}</p>
                    </div>
                    <button 
                        class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 self-start sm:self-center"
                        onclick={() => addTrackAndSimilar(track)}
                        disabled={processingTrack === track.name || addedTracks.includes(track.name)}
                    >
                        {#if processingTrack === track.name}
                            ⏳ Adding...
                        {:else if addedTracks.includes(track.name)}
                            ✓ Added
                        {:else}
                            ➕ Add + Similar
                        {/if}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    /* Add any component-specific styles here */
</style>