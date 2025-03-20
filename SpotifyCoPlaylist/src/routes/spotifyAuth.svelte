<script lang="ts">
    import { onMount } from 'svelte';
    import Cookies from "js-cookie";
    import { 
        redirectToAuthCodeFlow, 
        clientId,
        getAccessToken,
        fetchFavoriteTrack,
        playFavoriteSong
    } from "$lib/script";
    import type { SpotifyTrack } from '$lib/types';
    let favoriteSong: SpotifyTrack | null = null;
    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
    /*import { Auth } from "./authClass.svelte"
    
    // let accessToken = ""; // ✅ Make these reactive
    let favoriteSong: SpotifyTrack | null = null;
    let favoriteSongHtml = ""; // ✅ Store the generated HTML as a string
    let {
        accessToken
    }:{
        accessToken: Auth;
    } = $props();
*/
    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!accessToken || accessToken === "undefined") {
            if (!code) {
                redirectToAuthCodeFlow(clientId);
            } else {
                try {
                    accessToken = await getAccessToken(clientId, code);
                    Cookies.set("spotify_access_token", accessToken, { expires: 1, secure: true, sameSite: "Strict" });
                    favoriteSong = await fetchFavoriteTrack(accessToken);
                } catch (error) {
                    console.error("Error fetching access token:", error);
                }
            }
        } else {
            try {
                favoriteSong = await fetchFavoriteTrack(accessToken);
            } catch (error) {
                console.error("Error fetching favorite song:", error);
            }
        }
        
    });

    async function favoriteTrack(accessToken:string) {
        favoriteSong = await fetchFavoriteTrack(accessToken);
        if (favoriteSong) {
                favoriteSongHtml = generateFavoriteSongHtml(favoriteSong); // ✅ Store HTML output
        }
        return favoriteSong;
    }

    function generateFavoriteSongHtml(track: SpotifyTrack): string {
        return `
            <h2 class="text-2xl font-semibold">${track.name}</h2>
            <p class="text-gray-400">Artist: ${track.artists.map(artist => artist.name).join(", ")}</p>
            <div class="flex justify-center mt-4">
                <img src="${track.album.images[0]?.url}" alt="${track.album.name}" class="w-48 h-48 rounded-lg shadow-lg" />
            </div>
            <p class="mt-4 text-gray-300">Album: ${track.album.name}</p>
            <p class="text-gray-500">Duration: ${Math.floor(track.duration_ms / 60000)}:${(track.duration_ms % 60000 / 1000).toFixed(0)}</p>
        `;
    }
</script>

<!-- UI -->
<div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black p-6">
    <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-6">
        ChatDPT's Store Bachelorprojekt
    </h1>

    {#if favoriteSong}
        <button 
            class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            on:click={() => playFavoriteSong(favoriteSong, accessToken)}
        > 
            🎵 Spil din favorit-sang
        </button>

        <div class="mt-6 p-6 bg-gray-900 rounded-lg shadow-lg w-full max-w-md text-center">
            <h1 class="text-xl font-semibold text-gray-200 mb-4">Her er din favorit-sang</h1>
            <div id="favoriteSong" class="text-white">{@html generateFavoriteSongHtml(favoriteSong)}</div>      
        </div>
    {/if}
</div>
