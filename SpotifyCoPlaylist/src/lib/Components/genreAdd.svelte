<script lang=ts>
    import { getLastFmToken, getLastFmSimilarTrack, getSimilarTracksInfo, searchForTrackLastFm, getTrackTopTags } from "$lib/lastFmApi";
    import { searchForSong } from "$lib/script";
    import { addToLeaderboard, addVotesToGenreFromTrack, addVotesToLeaderboard, getGenreTracker, voteForTrack } from "$lib/api";
    import { adminToken, refreshToken } from "$lib/adminTokenManager";
    import { recordVote, hasVotedForTrack } from "$lib/voteTracker";  // Add hasVotedForTrack
    import type { SpotifyTrack } from "$lib/types";
    import { onMount } from "svelte";
    
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
    // Track the IDs of Spotify tracks that have been added
    let addedSpotifyIds = $state<string[]>([]);

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

    async function addTrack(track: any) {
        if (!$adminToken) {
            searchError = "Not connected to Spotify API";
            return;
        }
        
        processingTrack = track.name;
        searchError = null;
        
        try {
            // First convert to Spotify track to get the ID
            const spotifyTrack = await convertTrackToSpotify(track);
            
            // Check if user has already voted for this track
            if (hasVotedForTrack(spotifyTrack.id) || addedSpotifyIds.includes(spotifyTrack.id)) {
                console.log(`User already voted for track ${spotifyTrack.id}`);
                addedTracks.push(track.name);
                addedSpotifyIds.push(spotifyTrack.id);
                return;
            }
            
            //Add track tags to genreTracker
            await addTrackTagsToGenreTracker(track);
            //Add track to leaderboard
            await addTrackToLeaderboard(track, spotifyTrack);
            //Add genre votes to leaderboard votes
            await addVotesFromGenre(track, spotifyTrack);
            
            // Record the user's vote for this track
            recordVote(spotifyTrack.id, 'increment');
            
            // Add to tracked IDs
            addedSpotifyIds.push(spotifyTrack.id);
        } catch (error) {
            console.error("Error adding track:", error);
            searchError = "Failed to add track. Please try again.";
        } finally {
            processingTrack = null;
        }
    }
    
    async function addTrackTagsToGenreTracker(track: any) {
        const trackTags = await getTrackTopTags(track.name, track.artist);
        await addVotesToGenreFromTrack(trackTags);
    }

    async function addTrackToLeaderboard(track: any, spotifyTrack: SpotifyTrack) {
       try {
            await addToLeaderboard(spotifyTrack); 
            addedTracks.push(track.name.toString());
            onSongAdded(spotifyTrack);
        } catch (error) {
            console.error("Error adding track to leaderboard:", error);
            searchError = "Failed to add track to leaderboard. Please try again.";
        }
    }

    async function addVotesFromGenre(track: any, spotifyTrack: SpotifyTrack) {
        try {
            const trackTagsResponse = await getTrackTopTags(track.name, track.artist);
            const genreTracker = await getGenreTracker();
            console.log("Genre Tracker:", genreTracker);

            // Get the most popular genre by genreTracker votes
            let genreVotes = genreTracker.genreTracker.map((genre: any) => {
                return {
                    name: genre.genre,
                    votes: genre.votes
                };
            });
            console.log("Genre Votes:", genreVotes);
            //check which track tag matches the genreTracker
            const matchingGenres = genreVotes.filter((genre: any) => {
                return trackTagsResponse.toptags.tag.some((tag: any) => tag.name === genre.name);
            });
            console.log("Matching Genres:", matchingGenres);
            
            if (matchingGenres.length === 0) {
                console.log("No matching genres found");
                return;
            }
            
            // Reduce to the track tag with the most votes
            const mostPopularGenre = matchingGenres.reduce((prev: any, current: any) => {
                return (prev.votes > current.votes) ? prev : current;
            }, { votes: 0 });
            console.log("Most Popular Genre:", mostPopularGenre);

            // Add votes to the genre from the track
            await addVotesToLeaderboard(spotifyTrack.id, mostPopularGenre.votes);
        } catch (error) {
            console.error("Error adding votes from genre:", error);
            searchError = "Failed to add votes from genre. Please try again.";
        }
    }

    async function convertTrackToSpotify(track: any): Promise<SpotifyTrack> {
        const trackName = track.name;
        const trackArtist = track.artist;
        let searchText = `${trackName} - ${trackArtist}`;
        console.log("Search Text:", searchText);
        //Search for track on Spotify
        const spotifySearch = await searchForSong($adminToken, searchText);
        console.log("Spotify Track:", spotifySearch.tracks.items[0]);
        const spotifyTrack = spotifySearch.tracks.items[0];
        if (!spotifyTrack) {
            throw new Error("No track found on Spotify");
        } else {
            return spotifyTrack;
        }
    }

    function closeSearch() {
        searchResults = [];
        searchQuery = "";
    }
    
    // Function to check if a track has been added or voted for
    function isTrackAdded(trackName: string): boolean {
        return addedTracks.includes(trackName);
    }
</script>

<div class="max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold mb-6 text-center">Search with Last.fm</h1>
    
    <div class="mb-4 text-sm text-gray-400">
        Find tracks on Last.fm and add track to leaderboard and vote for genres.
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
            Close Results
        </button>
        
        <ul class="mt-4 space-y-4">
            {#each searchResults as track}
                {@const isAdded = isTrackAdded(track.name)}
                <li class="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 shadow-md {isAdded ? 'border border-green-600' : ''}">
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
                        class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 self-start sm:self-center {isAdded ? 'opacity-50 cursor-not-allowed' : ''}"
                        onclick={() => addTrack(track)}
                        disabled={processingTrack === track.name || isAdded}
                    >
                        {#if processingTrack === track.name}
                            ⏳ Adding...
                        {:else if isAdded}
                            ✓ Added
                        {:else}
                            ➕ Add + Vote for Genre
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