<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { onMount } from "svelte";
    import { 
        initializeLeaderboard, 
        getLeaderboard, 
        resetLeaderboard, 
        setServerAdminToken, 
        clearServerAdminToken,
        getSessionStatus,
        setSessionStatus,
        isAdminVerified,
        verifyAdminPassword 
    } from "$lib/api";
    import { 
        skipSong,
        playOrPause
     } from "$lib/script";
    import Cookies from "js-cookie";
    import { adminToken, refreshToken, debugTokenState, forceSetToken } from "$lib/adminTokenManager"; 

     //Password protection state
     let passwordVerified = $state(false);
     let passwordInput = $state("");
     let passwordError = $state('');
     let isVerifying = $state(false);


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
        //Check if password is verified
        const isVerified = localStorage.getItem("adminPasswordVerified");

        if (isVerified === 'true') {
            passwordVerified = true;
        } 


        const data = await getLeaderboard();
        console.log(data);
        leaderboardState.initialized = data.initialized;
        start = await getSessionStatus(); // Get the session status
    });

    async function verifyPassword() {
        if (!passwordInput) {
            passwordError = "Please enter a password.";
            return;
        }
        isVerifying = true;

        try {
            let success = await verifyAdminPassword(passwordInput);
            if (!success) {
                passwordError = "Incorrect password. Please try again.";
                return;
            } else {
                passwordVerified = true;
            }
        } catch (error) {
            passwordError = "Incorrect password. Please try again.";
            console.error("Password verification failed:", error);
        } finally {
            isVerifying = false;
        }
    }

    //When pressing enter in password field
    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            verifyPassword();
        }
    }

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
        await setSessionStatus('active'); // Set the session status to true
        start = await getSessionStatus(); // Get the session status
    }

    async function stopSession() {
        if (leaderboardState.initialized) {
            const data = await resetLeaderboard();
            console.log("Session ended");
            leaderboardState.initialized = data.initialized;
            await clearServerAdminToken(); // Clear the admin token when session ends
        }
        await setSessionStatus('inactive'); // Set the session status to false
        start = await getSessionStatus(); // Get the session status
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

{#if !passwordVerified}
<div class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75">
    <div class="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 class="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
        <p class="text-gray-300 mb-6">Please enter the admin password to continue.</p>
        
        <div class="mb-4">
            <input 
                type="password"
                bind:value={passwordInput}
                onkeydown={handleKeyDown}
                placeholder="Enter password"
                class="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
        </div>
        
        {#if passwordError}
            <p class="text-red-400 mb-4">{passwordError}</p>
        {/if}
        
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={verifyPassword}
            disabled={isVerifying}
        >
            {isVerifying ? 'Verifying...' : 'Submit'}
        </button>
    </div>
</div>
{:else}

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
{/if}