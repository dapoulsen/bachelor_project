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

    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
    let favoriteSong: SpotifyTrack | null = null;

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        console.log("Checking stored access token:", accessToken); // Debugging

        if (accessToken == "undefined") {
            if (!code) {
                console.log("No token or code found, redirecting to login.");
                redirectToAuthCodeFlow(clientId);
            } else {
                try {
                    console.log("Found auth code, requesting access token...");
                    accessToken = await getAccessToken(clientId, code);
                    Cookies.set("spotify_access_token", accessToken, { expires: 1, secure: true, sameSite: "Strict" });

                    console.log("Access token set:", accessToken);
                    favoriteSong = await fetchFavoriteTrack(accessToken);
                } catch (error) {
                    console.error("Fejl ved hentning af access token:", error);
                }
            }
        } else {
            console.log("Using stored access token:", accessToken);
            try {
                favoriteSong = await fetchFavoriteTrack(accessToken);
            } catch (error) {
                console.error("Fejl ved hentning af favorit-sang:", error);
            }
        }
    });

    function generateFavoriteSongHtml(track: SpotifyTrack): string {
        return `
          <h2>${track.name}</h2>
          <p>Artist: ${track.artists.map(artist => artist.name).join(", ")}</p>
          <img src="${track.album.images[0]?.url}" alt="${track.album.name}" width="200" />
          <p>Album: ${track.album.name}</p>
          <p>Duration: ${Math.floor(track.duration_ms / 60000)}:${(track.duration_ms % 60000 / 1000).toFixed(0)}</p>
        `;
    }
</script>

<!-- UI -->
<div class="h-24 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500">
    <h1 class="font-[helvetica] text-6xl">
        ChatDPT's store bachelorprojekt 
    </h1>

    {#if favoriteSong}
        <button 
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
            on:click={() => playFavoriteSong(favoriteSong, accessToken)}
        > 
            Spil din favorit-sang
        </button>

        <div class="container">
            <h1>Her er din favorit-sang</h1>
            <div id="favoriteSong">{@html generateFavoriteSongHtml(favoriteSong)}</div>      
        </div>
    {/if}
</div>
