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
    import { Auth } from "./authClass.svelte"
    
    // let accessToken = ""; // ✅ Make these reactive
    let favoriteSong: SpotifyTrack | null = null;
    let favoriteSongHtml = ""; // ✅ Store the generated HTML as a string
    let {
        accessToken
    }:{
        accessToken: Auth;
    } = $props();

    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
            redirectToAuthCodeFlow(clientId);
        } else {
            try{
                console.log("code", code)
                let at = await getAccessToken(clientId, code);
                accessToken.setToken(at);
            } catch (error) {
                console.error("din spasser, her er fejlen", error)
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
    
</div>

<!-- <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick={() => playFavoriteSong(favoriteSong, accessToken)}> 
    Spil din favorit-sang
</button> -->

<!-- <div class="container">
    <h1>Her er din favorit-sang</h1>
    {#await favoriteTrack(accessToken)}
        <p>Loading...</p>
        
    {:then favoriteSong} 
    {#if favoriteSong != null}
        <div id="favoriteSong">{@html favoriteSongHtml}</div>      
        {console.log(favoriteSong)}
    {/if}
        
    {/await}
  
    
</div> -->