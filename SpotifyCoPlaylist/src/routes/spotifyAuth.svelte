<script lang="ts">
    import { onMount } from 'svelte';
    import { 
        redirectToAuthCodeFlow, 
        clientId,
        getAccessToken,
        fetchFavoriteTrack,
        playFavoriteSong
     } from "$lib/script";
    import type { SpotifyTrack } from '$lib/types';
    let accessToken = ""; // ✅ Make these reactive
    let favoriteSong: SpotifyTrack | null = null;
    let favoriteSongHtml = ""; // ✅ Store the generated HTML as a string
    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
            redirectToAuthCodeFlow(clientId);
        } else {
            try{
            accessToken = await getAccessToken(clientId, code);
            favoriteSong = await fetchFavoriteTrack(accessToken);
            if (favoriteSong) {
                favoriteSongHtml = generateFavoriteSongHtml(favoriteSong); // ✅ Store HTML output
        }
            } catch (error) {
                console.error("din spasser, her er fejlen", error)
            }
            
        }
    });
    function generateFavoriteSongHtml(track: SpotifyTrack): string {
    return `
      <h2>${track.name}</h2>
      <p>Artist: ${track.artists.map(artist => artist.name).join(", ")}</p>
      <img src="${track.album.images[0]?.url}" alt="${track.album.name}" width="200" />
      <p>Album: ${track.album.name}</p>
      <p>Duration: ${track.duration_ms}</p>
    `;
  }
</script>

<div class="h-24 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500">

    <h1 class="font-[helvetica] text-6xl">
        ChatDPT's store bachelorprojekt 
    </h1>
    
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick={() => playFavoriteSong(favoriteSong, accessToken)}> 
        Spil din favorit-sang
    </button>
    
    <div class="container">
        <h1>Her er din favorit-sang</h1>
      
        {#if favoriteSong != null}
            <div id="favoriteSong">{@html favoriteSongHtml}</div>      
            {console.log(favoriteSong)}
        {/if}
    </div>
    </div>