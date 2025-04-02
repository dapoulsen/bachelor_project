<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { onMount } from "svelte";
    import { initializeLeaderboard, getLeaderboard, resetLeaderboard } from "$lib/api";

    let leaderboardState = $state({
        initialized: false
    });
    let start = $state(false);


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

</script>

<SpotifyAuth />

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    {#if !start}
    <button id="start-button" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
     onclick={() => startSession()}>
        Start Session
    </button>
    {:else}
    <CurrentlyPlaying />
    <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
     onclick={() => stopSession()}>
        End Session
    </button>
    {/if}
</main>