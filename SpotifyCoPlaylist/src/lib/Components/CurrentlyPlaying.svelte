<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { SpotifyTrack } from "$lib/types.js";
    import { fetchCurrentTrack, queueSelectedSong } from "$lib/script";
    import { Tween } from "svelte/motion";
    import { getLeaderboard, getServerAdminToken, removeFromLeaderboard, setCurrentSong } from "$lib/api";
    import { adminToken, refreshToken, tokenReady } from "$lib/adminTokenManager";
    import { removeVote } from "$lib/voteTracker";
    
    

    let { onPlayStateChange } = $props<{
        onPlayStateChange?: (is_playing: boolean) => void;
    }>();

    // State for component
    let currentlyPlaying = $state<SpotifyTrack | null>(null);
    let is_playing = $state(false);
    let duration = $state(0);
    let startTime = $state(0);

    let hasAddedSong = $state(false);
    //Create a Tween instance to animate the progress bar
    const progress = new Tween(0, { duration: 100});

    // Intervals for updating song progress and syncing with server
    let updateInterval = $state<ReturnType<typeof setInterval> | null>(null);
    let syncInterval = $state<ReturnType<typeof setInterval> | null>(null);

        
    interface LeaderboardItem {
        track: SpotifyTrack;
        votes: number;
    }
    let leaderboardState = $state({
        list: [] as LeaderboardItem[]
    })


    async function refreshLeaderboard() {
        try {
            const data = await getLeaderboard();
            console.log("Refreshed leaderboard data:", data);
            leaderboardState = data;
        } catch (error) {
            console.error("Error refreshing leaderboard:", error);
        }
    }
    
    async function addToQueue() {
        if (hasAddedSong) {
            console.log("Song already added to queue, skipping...");
            return;
        }
        
        // Set the flag immediately to prevent parallel calls
        hasAddedSong = true;
        
        try {
            await refreshLeaderboard(); 
            
            if (leaderboardState.list.length > 0) {
                if (!$adminToken) {
                    console.error("No admin token available. Cannot queue song.");
                    hasAddedSong = false; // Reset flag on error
                    return;
                }

                const track = leaderboardState.list[0].track;
                console.log("Queueing song:", track.name);
                await queueSelectedSong(track, $adminToken);
                
                // Only remove from leaderboard after successfully queuing
                await removeFromLeaderboard(track.id);
                await refreshLeaderboard();
            } else {
                console.log("No songs available in leaderboard to queue");
            }
        } catch (error) {
            console.error("Failed to add song to queue:", error);
            hasAddedSong = false; // Reset the flag only on error
        }
    }


    async function updateSong() {
        try {
            // First check if we have an admin token
            if (!$adminToken) {
                console.error('No admin token available. Cannot fetch current song.');
                return;
            }

            // Fetch the current track directly from Spotify API
            const spotifyData = await fetchCurrentTrack($adminToken);
            
            if (!spotifyData) {
                console.log('No track currently playing from Spotify API.');
                stopProgress();
                currentlyPlaying = null;
                return;
            }

            // Store the previous play state
            const wasPlaying = is_playing;
            
            // Update the play state
            is_playing = spotifyData.is_playing;
            
            // Notify parent if play state changed
            if (wasPlaying !== is_playing && onPlayStateChange) {
                onPlayStateChange(is_playing);
            }

            const song = spotifyData.item;
            const progressMs = spotifyData.progress_ms;

            // Check if it's a new song or first load
            if (!currentlyPlaying || currentlyPlaying.id !== song.id) {
                console.log('New song detected:', song);
                currentlyPlaying = song;
                await startNewSongProgress(song, progressMs);
                hasAddedSong = false;
                
                // Also update our server's current song state
                try {
                    await fetch('/api/currentSong', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            song,
                            progress_ms: progressMs,
                            is_playing
                        })
                    });
                } catch (error) {
                    console.error('Failed to update server with current song:', error);
                }
            } else {
                // Same song, just sync progress
                syncProgress(progressMs);
            }

            // If not playing, stop the progress
            if (!is_playing) {
                stopProgress();
            } else if (!updateInterval) {
                // If playing but no interval, restart progress tracking
                await startNewSongProgress(song, progressMs);
            }
        } catch (error) {
            console.error('Error fetching current song:', error);
        }
    }

    // Start progress tracking for a new song
    async function startNewSongProgress(song: SpotifyTrack, progressMs: number) {
        // Safety check
        if (!song || typeof song.duration_ms !== 'number') {
            console.error("Invalid song object:", song);
            return;
        }
        // Clear any existing intervals
        stopProgress();

        //Initialize progress tracking
        duration = song.duration_ms;
        const initialProgress = progressMs || 0;
        startTime = Date.now() - initialProgress;
    
        await setCurrentSong(song);

        // Set initial progress immediately
        progress.set(initialProgress, { duration: 0 }); // No animation for the first set

        // remove vote from local storage
        removeVote(song.id);
        
        // Reset the hasAddedSong flag for the new song
        hasAddedSong = false;

        console.log(`Starting progress for: ${song.name}`);

        // Use a closure-scoped variable for this particular song's interval
        let queueTriggered = false; 
        let queueInProgress = false;

        if (is_playing) {
            updateInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                
                // Only trigger queue once when we reach the threshold
                // Added additional guard with queueInProgress to prevent parallel executions
                if (elapsed >= duration - 8000 && !hasAddedSong && !queueTriggered && !queueInProgress) {
                    queueTriggered = true; // Set flag to prevent further attempts
                    queueInProgress = true; // Set in-progress flag
                    
                    console.log("Queue threshold reached, triggering queue addition");
                    
                    addToQueue()
                        .then(() => {
                            console.log("Queue addition completed");
                        })
                        .catch(error => {
                            console.error("Queue addition failed:", error);
                            // Only reset the trigger if this exact interval instance is still active
                            if (updateInterval) {
                                queueTriggered = false;
                            }
                        })
                        .finally(() => {
                            queueInProgress = false;
                        });
                }
                
                if (elapsed <= duration) {
                    progress.set(elapsed); // Update progress bar
                } else {
                    updateSong();
                }
            }, 1000); // Update every second
        }
    }

    // Sync progress with the server
    function syncProgress(progressMs: number) {
        if (!currentlyPlaying) return; // Safety check
        const clientProgress = Date.now() - startTime;

        if (Math.abs(clientProgress - progressMs) > 2000) {
            console.log("Syncing progress:", formatTime(clientProgress), formatTime(progressMs));
            startTime = Date.now() - progressMs;
            progress.set(progressMs, { duration: 1000 }); // Animate to the new progress
            }
        
    }
    

    function stopProgress() {
        // Clear the progress interval
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0' )}`;
    }

    onMount(async () => {
        console.log("CurrentlyPlaying component mounting, checking for token...");
        console.log("Initial token state:", $adminToken ? "Token exists" : "No token");
        
        // If no token, first try to refresh it
        if (!$adminToken) {
            console.log("No token on mount, attempting refresh...");
            const hasToken = await refreshToken();
            console.log("Initial token refresh result:", hasToken ? "✅ Success" : "❌ Failed");
            
            // Add a small delay to ensure reactivity has time to propagate
            if (hasToken) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Try a few times to ensure token is available (with short delays)
        let attempts = 0;
        while (!$adminToken && attempts < 10) {
            console.log(`Waiting for token (attempt ${attempts + 1}/10)...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Proceed with initialization
        if ($adminToken) {
            console.log("Token available, initializing component ...");
            updateSong();
            syncInterval = setInterval(updateSong, 10000);
        } else {
            console.error("Failed to get token after multiple attempts");
        }
    });

    onDestroy(() => {
        stopProgress();
        if (syncInterval) {
            clearInterval(syncInterval);
        }
    });

</script>

<h1 class="font-bold">Current Track:</h1>

{#if $tokenReady && currentlyPlaying}
    <!-- Replace the progress bar section with link -->
<div class="flex items-center bg-gray-800 p-4 rounded-lg shadow-lg">
    <img src="{currentlyPlaying.album.images[0].url}" alt="Album cover" class="w-16 h-16 rounded-lg">
    <div class="ml-4">
        <p class="text-xl font-bold">{currentlyPlaying.name}</p>
        <p class="text-lg">{currentlyPlaying.artists[0].name}</p>
        
        <!-- Replace progress bar with link -->
        <a 
            href={currentlyPlaying.external_urls.spotify} 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-green-500 hover:text-green-400 transition-colors mt-2 inline-block"
        >
            Open in Spotify →
        </a>
    </div>
</div>

<!-- Remove the style section since we don't need progress bar styles anymore -->
{:else if !$tokenReady}
    <h1 class="text-4xl font-bold mb-6"> Loading player... </h1>
{:else}
    <h1 class="text-4xl font-bold mb-6"> No song currently playing </h1>
{/if}



<style>
    progress {
        display: block;
        width: 100%;
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        background-color: #333;
    }
    
    progress::-webkit-progress-bar {
        background-color: #333;
        border-radius: 4px;
    }
    
    progress::-webkit-progress-value {
        background-color: #1DB954; /* Spotify green */
        border-radius: 4px;
        transition: width 0.1s linear;
    }
    
    progress::-moz-progress-bar {
        background-color: #1DB954;
        border-radius: 4px;
    }
</style>