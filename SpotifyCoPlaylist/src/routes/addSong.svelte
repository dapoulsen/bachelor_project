<script lang="ts">
    import { 
        searchForSong,
        getAccessToken
    } from "$lib/script"
    import type { SpotifySearchResponse } from '$lib/types';
    import { Auth } from "./authClass.svelte"

    let {
        accessToken
    }:{
        accessToken: Auth;
    } = $props();
    
    let searchResults = $state<SpotifySearchResponse | null>(null);

    let songSearch = $state({
        search: ""
    });
    
</script>



<div>
    <h1>Add Song</h1>
    <input bind:value={songSearch.search} type="text" placeholder="Search for a song" />
    
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick={async () => searchResults = await searchForSong(accessToken.getToken(), songSearch.search)}>Search</button>
    
    {#if searchResults}
        <ul>
            {#each searchResults.tracks.items as track}
                <li>
                    <p>{track.name}</p>
                    <p>{track.artists.map(artist => artist.name).join(", ")}</p>
                    <img src={track.album.images[0]?.url} alt={track.album.name} width="200" />
                    <p>{track.album.name}</p>
                    <p>{track.duration_ms}</p>
                </li>
            {/each}
        </ul>
    {/if}
</div>