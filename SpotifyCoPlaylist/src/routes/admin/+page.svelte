<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";
    import { onMount } from "svelte";
    import { 
        initializeLeaderboard, 
        getLeaderboard, 
        resetLeaderboard, 
        setAdminToken, 
        clearServerAdminToken,
        getSessionStatus,
        setSessionStatus,
        isAdminVerified,
        verifyAdminPassword,
        removeFromLeaderboard,
    } from "$lib/api";
    import { 
        skipSong,
        playOrPause,

        queueSelectedSong

     } from "$lib/script";
    import Cookies from "js-cookie";
    import { tokenReady } from "$lib/adminTokenManager"; 

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
        passwordVerified = isAdminVerified();
        console.log("Password verified:", passwordVerified);

        const data = await getLeaderboard();
        console.log(data);
        leaderboardState.initialized = data.initialized;
        let sessionStatus = await getSessionStatus(); // Get the session status
        if (sessionStatus === 'active') {
            start = true; // Set start to true if session is active
        } else {
            start = false; // Set start to false if session is inactive
        }
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

    

    async function startSession(){
        if (!leaderboardState.initialized) {
            const data = await initializeLeaderboard();
            console.log("Session started", data.initialized);
            leaderboardState.initialized = data.initialized;
        }

        accessToken = Cookies.get("spotify_access_token"); // Retrieve from cookies
        
        // Use the simplified function that handles both server and client
        console.log("ACCESSTOKEN IS: ", accessToken);
        const success = await setAdminToken(accessToken);
        
        if (success) {
            console.log("Admin token set successfully on server and client");
            // No need to call forceSetToken separately - it's handled in setAdminToken
            
            // Wait for next tick to ensure reactivity completes
            await new Promise(resolve => setTimeout(resolve, 0));
        } else {
            console.error("Failed to set admin token.");
            return;
        }
        
        let sessionStatus = await setSessionStatus('active');
        if (sessionStatus === 'active') {
            start = true;
        } else {
            start = false;
        }
    }

    async function stopSession() {
        if (leaderboardState.initialized) {
            const data = await resetLeaderboard();
            console.log("Session ended");
            leaderboardState.initialized = data.initialized;
            await clearServerAdminToken(); // Clear the admin token when session ends
        }
        let sessionStatus = await setSessionStatus('inactive'); // Set the session status to false
        if (sessionStatus === 'inactive') {
            start = false; // Set start to false if session is inactive
        } else {
            start = true; // Set start to true if session is active
        }
        await togglePlay(false); // Ensure the play state is set to false when ending the session
    }

    async function skip() {
        if (leaderboardState.initialized) {
            const leaderboard = await getLeaderboard();
            console.log("Leaderboard data:", leaderboard);
            const topSong = leaderboard.list[0].track; // Get the top song from the leaderboard
            await queueSelectedSong(topSong, accessToken); // Queue the selected song
            const data = await skipSong(accessToken);
            await removeFromLeaderboard(topSong.id); // Remove the song from the leaderboard after skipping
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
            {#if $tokenReady}
                <CurrentlyPlaying onPlayStateChange={handlePlayStateChange} />
            {:else}
                <p>Loading player...</p>
            {/if}
            <div>
                <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                onclick={() => skip()}>
                    Skip Song
                </button>
                <button class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                onclick={() => togglePlay(isPlaying)}>
                    {isPlaying ? "Pause" : "Play"}
                </button>
            </div>
            <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            onclick={() => stopSession()}>
                End Session
            </button>
        {/if}
        
    </main>
{/if}