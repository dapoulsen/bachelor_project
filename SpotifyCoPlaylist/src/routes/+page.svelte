<script lang="ts">
    import SpotifyAuth from "./spotifyAuth.svelte";
    import Increment from "./Increment.svelte";
    import AddSong from "./addSong.svelte";
    import Cookies from "js-cookie";
    
    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let userState = $state({
        state: 0
    });

    function setState(newState: number) {
        userState.state = newState;
    }
    
</script>

<SpotifyAuth />

<main>
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => setState(1)}> Tilføj </button>
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => setState(2)}> Stem </button>
    {#if userState.state === 1}
        <AddSong />
    {:else if userState.state === 2}
        <Increment />
    {/if}
</main>


<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }
    
    :global(p), 
    :global(h1), 
    :global(h2), 
    :global(h3), 
    :global(h4), 
    :global(h5), 
    :global(h6) {
        color: #ddd5d5;
    }

</style>