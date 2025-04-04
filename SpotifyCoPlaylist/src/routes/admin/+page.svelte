<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { onMount } from "svelte";
    import { initializeLeaderboard, getLeaderboard, resetLeaderboard, setServerAdminToken, clearServerAdminToken } from "$lib/api";
    import { 
        skipSong,
        playOrPause
     } from "$lib/script";
    import Cookies from "js-cookie";
    import { adminToken, refreshToken, debugTokenState, forceSetToken } from "$lib/adminTokenManager"; 

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

    async function debugAdminToken() {
        console.log("------ Admin Token Debug ------");
        console.log("Current token from store:", $adminToken ? "✅ Token exists" : "❌ No token");
        debugTokenState();
        
        try {
            console.log("Making direct API call...");
            const response = await fetch('/api/admin-token');
            const data = await response.json();
            console.log("API response:", data);
            
            // Try to set token directly
            console.log("Setting token again...");
            const setResponse = await fetch('/api/admin-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: accessToken })
            });
            console.log("Set token response:", await setResponse.json());
            const setData = await setResponse.json();

            // CRITICAL FIX: Force-set the token here too for debugging
            if (setData.success && accessToken) {
                forceSetToken(accessToken);
                console.log("Token force-set in debug function");
            }
            
            // Refresh the token in the client
            await refreshToken();
            console.log("Token after refresh:", $adminToken ? "✅ Token exists" : "❌ No token");
        } catch (error) {
            console.error("Error in debug function:", error);
        }
        console.log("----------------------------");
    }

    async function startSession(){
        if (!leaderboardState.initialized) {
            const data = await initializeLeaderboard();
            leaderboardState.initialized = data.initialized;
            // Set the admin token when session starts
            
        }
        const success = await setServerAdminToken(accessToken);
        console.log(success);
        if (success) {
            console.log("Admin token set successfully.");
            forceSetToken(accessToken); // Set the token in the client store

            debugTokenState();

        } else {
            console.error("Failed to set admin token.");
            return;
        }
        console.log("Session started:", $adminToken);
        start = true;
    }

    async function stopSession() {
        if (leaderboardState.initialized) {
            const data = await resetLeaderboard();
            console.log("Session ended");
            leaderboardState.initialized = data.initialized;
            await clearServerAdminToken(); // Clear the admin token when session ends
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
    <button 
    class="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 mt-4"
    onclick={debugAdminToken}>
    Debug Admin Token
</button>
</main>