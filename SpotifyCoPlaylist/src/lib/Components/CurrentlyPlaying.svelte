<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import Cookies from "js-cookie";
    import type { SpotifyTrack } from "$lib/types.js";
    import { fetchCurrentTrack, queueSelectedSong } from "$lib/script";
    import { Tween } from "svelte/motion";
    import { getLeaderboard, removeFromLeaderboard } from "$lib/api";
    import { getAdminToken } from "../../routes/admin/store";
    

    let { onPlayStateChange } = $props<{
        onPlayStateChange?: (is_playing: boolean) => void;
    }>();

    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let currentlyPlaying = $state<SpotifyTrack | null>(null);
    let is_playing = $state(false);
    let duration = $state(0);
    let startTime = $state(0);
    let hasAddedSong = false;
    //Create a Tween instance to animate the progress bar
    const progress = new Tween(0, { duration: 100});

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
        if (hasAddedSong === false){
        await refreshLeaderboard(); 
        if (leaderboardState.list.length > 0){
            try{
                
                let track = leaderboardState.list[0].track;
                console.log("Queueing song:", track.name);
                await queueSelectedSong(track, accessToken);
                hasAddedSong = true
                await removeFromLeaderboard(track.id);
                await refreshLeaderboard();            
            } catch (error) {
                console.error("Hallo idiot, det virker ikk", error);
            }
        } else {
            console.log("har du overvejet at der skal være sange her");
        }
    }
        
    }
    async function updateSong() {
        try {
            if(getAdminToken()){}
            const data = await fetchCurrentTrack(getAdminToken());
            if (!data) {
                stopProgress();
                currentlyPlaying = null
                return;
            }
            console.log("Current track data:", data);

            // Check if data has the expected structure
            if (!data.item) {
                console.error("Invalid data structure from API:", data);
                return;
            }
        
            const song = data.item;
            const progressMs = data.progress_ms || 0;

            //store the previous play state
            const wasPlaying = is_playing;
            //Update the play state
            is_playing = data.is_playing !== undefined ? data.is_playing : false; // Default to false if undefined

            // Notify parent if play state changed
            if (wasPlaying !== is_playing && onPlayStateChange) {
                onPlayStateChange(is_playing);
            }

            // Check if it's a new song or first load
            if (!currentlyPlaying || currentlyPlaying.id !== song.id) {
                console.log("New song detected:", song);
                currentlyPlaying = song;
                startNewSongProgress(song, progressMs);
                hasAddedSong = false;
            } else {
                // Same song, just sync progress
                syncProgress(progressMs);
            }

             // If not playing, stop the progress
             if (!is_playing) {
                stopProgress();
            } else if (!updateInterval) {
                // If playing but no interval, restart progress tracking
                startNewSongProgress(song, progressMs);
            }

    } catch (error) {
            console.error("Error fetching current track:", error);
        }
    }

    // Start progress tracking for a new song
    function startNewSongProgress(song: SpotifyTrack, progressMs: number) {
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

        // Set initial progress immediately
        progress.set(initialProgress, { duration: 0 }); // No animation for the first set

        console.log(`Starting progress for: ${song.name}`);

        if (is_playing) {
            updateInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration - 5000){
                addToQueue();
            }
            if (elapsed <= duration) {
                progress.set(elapsed); // Update progress bar
            } else {
                updateSong();
            }
            }, 1000); // Update every second}
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

    onMount(() => {
        updateSong();

        syncInterval = setInterval(updateSong, 10000)
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