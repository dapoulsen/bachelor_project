<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import type { SpotifyTrack } from "$lib/types";
    import { Tween } from "svelte/motion";
    import { removeVote } from "$lib/voteTracker";
    
    // State for component
    let currentlyPlaying = $state<SpotifyTrack | null>(null);
    let progress_ms = $state(0);
    let duration = $state(0);
    let is_playing = $state(false);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    
    // Progress bar animation
    const progress = new Tween(0, { duration: 100 });
    
    // Tracking time
    let startTime = $state(0);
    let updateInterval = $state<ReturnType<typeof setInterval> | null>(null);
    
    // Format milliseconds into MM:SS display
    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Fetch current song from our own API
    async function fetchCurrentSong() {
        try {
            const response = await fetch('/api/currentSong', {
                method: 'GET'
            });
            
            if (!response.ok) {
                error = `Error fetching current song: ${response.status}`;
                return;
            }
            
            const data = await response.json();
            
            // Check if the response contains a song
            if (data.currentSong) {
                const newSong = data.currentSong;
                const newProgress = data.progress_ms || 0;
                const newIsPlaying = data.is_playing !== undefined ? data.is_playing : false;
                
                // If it's a new song or first load
                if (!currentlyPlaying || currentlyPlaying.id !== newSong.id) {
                    currentlyPlaying = newSong;
                    duration = newSong.duration_ms;
                    startTime = Date.now() - newProgress;
                    progress.set(newProgress, { duration: 0 });
                    removeVote(newSong.id);
                }
                
                // Update play state
                if (is_playing !== newIsPlaying) {
                    is_playing = newIsPlaying;
                    
                    if (is_playing) {
                        startProgressTracking(newProgress);
                    } else {
                        stopProgressTracking();
                    }
                }
                
                // Always update progress from server
                progress_ms = newProgress;
            } else {
                currentlyPlaying = null;
                stopProgressTracking();
            }
        } catch (e) {
            console.error("Error fetching current song:", e);
            error = "Failed to fetch current song";
        } finally {
            isLoading = false;
        }
    }
    
    // Start tracking progress locally
    function startProgressTracking(initialProgress: number = 0) {
        stopProgressTracking(); // Clear any existing interval
        
        startTime = Date.now() - initialProgress;
        progress.set(initialProgress, { duration: 0 });
        
        updateInterval = setInterval(() => {
            if (currentlyPlaying) {
                const elapsed = Date.now() - startTime;
                if (elapsed <= currentlyPlaying.duration_ms) {
                    progress.set(elapsed);
                }
            }
        }, 1000);
    }
    
    // Stop progress tracking
    function stopProgressTracking() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    onMount(() => {
        // Initial fetch
        fetchCurrentSong();
        
        // Set up polling interval - much less frequent than direct Spotify API calls
        const intervalId = setInterval(fetchCurrentSong, 5000);
        
        return () => {
            clearInterval(intervalId);
            stopProgressTracking();
        };
    });
    
    onDestroy(() => {
        stopProgressTracking();
    });
</script>

<div class="mb-8">
    <h2 class="text-2xl font-semibold mb-4 text-center">Now Playing</h2>
    
    {#if isLoading}
        <div class="p-4 bg-gray-800 rounded-lg text-center">
            <p class="text-gray-400">Loading current track...</p>
        </div>
    {:else if error}
        <div class="p-4 bg-gray-800 rounded-lg text-center">
            <p class="text-red-400">{error}</p>
        </div>
    {:else if currentlyPlaying}
       <!-- Replace the progress bar section with link -->
<div class="bg-gray-800 p-4 rounded-lg flex items-center space-x-4 shadow-md">
    <img 
        src={currentlyPlaying.album.images[0]?.url} 
        alt={currentlyPlaying.album.name} 
        class="w-16 h-16 rounded-lg"
    />
    <div class="flex-1">
        <p class="text-lg font-semibold">{currentlyPlaying.name}</p>
        <p class="text-gray-400">{currentlyPlaying.artists.map(artist => artist.name).join(", ")}</p>
        
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
    {:else}
        <div class="p-4 bg-gray-800 rounded-lg text-center">
            <p class="text-gray-400">No track currently playing</p>
        </div>
    {/if}
</div>