<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { onMount } from "svelte";
    import { initializeLeaderboard, getLeaderboard, resetLeaderboard } from "$lib/api";
    import { 
        skipSong,
        playOrPause
     } from "$lib/script";
    import Cookies from "js-cookie";

    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let leaderboardState = $state({
        initialized: false
    });
    let start = $state(false);
    let isPlaying = $state(false);

    function handlePlayStateChange(is_playing: boolean) {
        isPlaying = is_playing;
    }


    onMount(async () => {
        const data = await getLeaderboard();
        console.log(data);
        leaderboardState.initialized = data.initialized;
    });

    async function startSession(){
        if (!leaderboardState.initialized) {
            const data = await initializeLeaderboard();
            console.log(data);
            leaderboardState.initialized = data.initialized;
        }
        start = true;
    }

    async function stopSession() {
        if (leaderboardState.initialized) {
            const data = await resetLeaderboard();
            console.log(data);
            leaderboardState.initialized = data.initialized;
        }
        start = false;
    }

    async function skip() {
        if (leaderboardState.initialized) {
            const data = await skipSong(accessToken);
            console.log(data);
        }
    }

    async function togglePlay(is_playing: boolean) {
        if (leaderboardState.initialized) {
            const data = await playOrPause(accessToken, is_playing);
            console.log(data);
            isPlaying = !is_playing; // Toggle the play state
        }
    }

</script>

<SpotifyAuth />

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    {#if !start}
    <button id="start-button" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
     onclick={() => startSession()}>
        Start Session
    </button>
    {:else}
    <CurrentlyPlaying onPlayStateChange={handlePlayStateChange} />
    <div>
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
         onclick={() => skip()}>
            Skip Song
        </button>
        <button class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
         onclick={() => togglePlay(isPlaying)}>
            {isPlaying ? "Pause" : "Play"}
    </div>
    <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
     onclick={() => stopSession()}>
        End Session
    </button>
    {/if}
</main>