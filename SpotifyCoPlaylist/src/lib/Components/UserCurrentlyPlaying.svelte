<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { SpotifyTrack } from "$lib/types.js";
    import { Tween } from "svelte/motion";
    
    // State for component
    let currentlyPlaying = $state<SpotifyTrack | null>(null);
    let is_playing = $state(false);
    let duration = $state(0);
    let startTime = $state(0);
    let progress_ms = $state(0);

    // Create a Tween instance to animate the progress bar
    const progress = new Tween(0, { duration: 100 });

    // Interval for updating song progress
    let updateInterval = $state<ReturnType<typeof setInterval> | null>(null);
    let syncInterval = $state<ReturnType<typeof setInterval> | null>(null);

    async function fetchCurrentSongFromServer() {
        try {
            const response = await fetch('/api/currentSong');
            if (!response.ok) {
                console.log('No current song information available');
                stopProgress();
                currentlyPlaying = null;
                return;
            }
            
            const data = await response.json();
            
            if (!data.currentSong) {
                console.log('No song currently playing');
                stopProgress();
                currentlyPlaying = null;
                return;
            }
            
            // Update playing state
            is_playing = data.is_playing ?? true; // Default to true if not specified
            
            // Update the song information
            if (!currentlyPlaying || currentlyPlaying.id !== data.currentSong.id) {
                currentlyPlaying = data.currentSong;
                if (currentlyPlaying) {
                    duration = currentlyPlaying.duration_ms;
                    progress_ms = data.progress_ms || 0;
                    startNewSongProgress(progress_ms);
                }
            } else {
                // Same song, just sync progress if provided
                if (data.progress_ms) {
                    syncProgress(data.progress_ms);
                }
            }
            
            // If not playing, stop the progress
            if (!is_playing) {
                stopProgress();
            } else if (!updateInterval) {
                // If playing but no interval, restart progress tracking
                startNewSongProgress(progress_ms);
            }
        } catch (error) {
            console.error('Error fetching current song from server:', error);
        }
    }

    // Start progress tracking for a song
    function startNewSongProgress(progressMs: number) {
        // Clear any existing intervals
        stopProgress();

        // Initialize progress tracking
        const initialProgress = progressMs || 0;
        startTime = Date.now() - initialProgress;

        // Set initial progress immediately
        progress.set(initialProgress, { duration: 0 }); // No animation for first set

        console.log(`Starting progress for: ${currentlyPlaying?.name}`);

        if (is_playing) {
            updateInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed <= duration) {
                    progress.set(elapsed); // Update progress bar
                } else {
                    fetchCurrentSongFromServer(); // Check for song change when we reach the end
                }
            }, 1000); // Update every second
        }
    }

    // Sync progress 
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
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    onMount(() => {
        // Initial fetch
        fetchCurrentSongFromServer();
        
        // Set up polling to get updates from server
        syncInterval = setInterval(fetchCurrentSongFromServer, 5000); // Check server every 5 seconds
    });

    onDestroy(() => {
        stopProgress();
        if (syncInterval) {
            clearInterval(syncInterval);
        }
    });
</script>

<h1 class="font-bold">Current Track:</h1>

{#if currentlyPlaying }
    <div class="flex items-center bg-gray-800 p-4 rounded-lg shadow-lg">
        <img src="{currentlyPlaying.album.images[0].url}" alt="Album cover" class="w-16 h-16 rounded-lg">
        <div class="ml-4">
            <p class="text-xl font-bold">{currentlyPlaying.name}</p>
            <p class="text-lg">{currentlyPlaying.artists[0].name}</p>
            
            <progress value={progress.current} max={duration} class="w-full mt-2"></progress>
            <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>{formatTime(progress.current)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    </div>
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