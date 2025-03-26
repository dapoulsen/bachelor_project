<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import Cookies from "js-cookie";
    import type { SpotifyTrack } from "$lib/types.js";
    import { fetchCurrentTrack } from "$lib/script";
    import { Tween } from "svelte/motion";

    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let currentlyPlaying = $state<SpotifyTrack | null>(null);
    


    async function updateSong() {
        const song = await fetchCurrentTrack(accessToken);
        currentlyPlaying = song;
    }

    onMount(() => {
        updateSong();

        const interval = setInterval(updateSong, 10000);

        return () => clearInterval(interval);
    });

    let progress = new Tween(0);

    $effect(() => {
        if (currentlyPlaying) {
            progress = new Tween(0, {
                duration: currentlyPlaying.duration_ms
            });
            progress.target = 1;
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
            
        </div>
    </div>
    <progress value={progress.current}></progress>
    <p>{progress.current}</p>
    <p>{progress.duration}</p>
{:else}
    <h1 class="text-4xl font-bold mb-6"> No song currently playing </h1>
{/if}

<style>
    progress {
        display: block;
        width: 100%;
    }
</style>