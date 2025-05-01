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
    let lastUpdateTime = $state(0); // Track when we last updated from API
    let isLoading = $state(true);
    let fetchError = $state(false);

    // Create a Tween instance to animate the progress bar
    const progress = new Tween(0, { duration: 100 });

    // Interval for updating song progress
    let updateInterval = $state<ReturnType<typeof setInterval> | null>(null);
    let syncInterval = $state<ReturnType<typeof setInterval> | null>(null);

    async function fetchCurrentSongFromServer() {
        const now = Date.now();
        
        // Don't update too frequently (prevent rapid fire API calls)
        if (now - lastUpdateTime < 2000) {
            return;
        }
        
        try {
            isLoading = true;
            fetchError = false;
            lastUpdateTime = now;
            
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
            
            // Store previous song to detect changes
            const previousSongId = currentlyPlaying?.id;
            
            // Update playing state
            const wasPlaying = is_playing;
            is_playing = data.is_playing ?? true; // Default to true if not specified
            
            // Update the song information
            if (!currentlyPlaying || currentlyPlaying.id !== data.currentSong.id) {
                console.log(`Song changed: ${previousSongId} → ${data.currentSong.id}`);
                currentlyPlaying = data.currentSong;
                
                if (currentlyPlaying) {
                    duration = currentlyPlaying.duration_ms;
                    progress_ms = data.progress_ms || 0;
                    startNewSongProgress(progress_ms);
                }
            } else {
                // Same song, just sync progress if provided
                if (data.progress_ms !== undefined) {
                    syncProgress(data.progress_ms);
                }
            }
            
            // Handle play state changes
            if (wasPlaying !== is_playing) {
                if (is_playing) {
                    // Resumed playing - restart progress tracking
                    startNewSongProgress(progress_ms);
                } else {
                    // Paused - stop progress tracking
                    stopProgress();
                }
            }
        } catch (error) {
            console.error('Error fetching current song from server:', error);
            fetchError = true;
        } finally {
            isLoading = false;
        }
    }

    // Start progress tracking for a song
    function startNewSongProgress(progressMs: number) {
        // Safety check
        if (!currentlyPlaying) return;
        
        // Clear any existing intervals
        stopProgress();

        // Initialize progress tracking
        const initialProgress = progressMs || 0;
        startTime = Date.now() - initialProgress;

        // Set initial progress immediately
        progress.set(initialProgress, { duration: 0 }); // No animation for first set

        console.log(`Starting progress for: ${currentlyPlaying.name} at ${formatTime(initialProgress)}`);

        if (is_playing) {
            updateInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed <= duration) {
                    progress.set(elapsed); // Update progress bar smoothly
                } else {
                    // We've reached the end of the track duration
                    // Wait a bit before checking for a new song to avoid rapid API calls
                    setTimeout(() => {
                        fetchCurrentSongFromServer();
                    }, 1000);
                }
            }, 500); // Update twice per second for smoother progress
        }
    }

    // Sync progress with the server
    function syncProgress(progressMs: number) {
        if (!currentlyPlaying) return; // Safety check
        
        const clientProgress = Date.now() - startTime;
        const difference = Math.abs(clientProgress - progressMs);

        // Only sync if difference is significant (more than 2 seconds)
        if (difference > 2000) {
            console.log(`Syncing progress: local=${formatTime(clientProgress)}, server=${formatTime(progressMs)}, diff=${Math.round(difference/1000)}s`);
            
            // Update our timing
            startTime = Date.now() - progressMs;
            
            // Smoothly animate to the correct position 
            progress.set(progressMs, { duration: 300 });
        }
    }

    function stopProgress() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function formatTime(ms: number): string {
        if (!ms || isNaN(ms)) return "0:00";
        
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    onMount(() => {
        // Initial fetch
        fetchCurrentSongFromServer();
        
        // Set up polling with a reasonable interval
        syncInterval = setInterval(fetchCurrentSongFromServer, 7500); // Check server every 7.5 seconds
    });

    onDestroy(() => {
        stopProgress();
        if (syncInterval) {
            clearInterval(syncInterval);
        }
    });
</script>

<h1 class="font-bold">Current Track:</h1>

{#if isLoading && !currentlyPlaying}
    <div class="text-lg font-medium mb-6">Loading current track...</div>
{:else if fetchError}
    <div class="text-lg font-medium mb-6 text-red-500">
        Unable to load current track. Retrying...
    </div>
{:else if currentlyPlaying}
    <div class="flex items-center bg-gray-800 p-4 rounded-lg shadow-lg">
        <img 
            src="{currentlyPlaying.album.images[0].url}" 
            alt="Album cover" 
            class="w-16 h-16 rounded-lg shadow-md"
        >
        <div class="ml-4 flex-1">
            <p class="text-xl font-bold truncate">{currentlyPlaying.name}</p>
            <p class="text-lg truncate">{currentlyPlaying.artists[0].name}</p>
            
            <progress value={progress.current} max={duration} class="w-full mt-2"></progress>
            <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>{formatTime(progress.current)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    </div>
{:else}
    <div class="text-xl font-medium mb-6">No song currently playing</div>
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
        transition: width 0.25s linear;
    }
    
    progress::-moz-progress-bar {
        background-color: #1DB954;
        border-radius: 4px;
    }
</style>