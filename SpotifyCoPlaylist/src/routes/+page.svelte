<script lang="ts">
    import SpotifyAuth from "./spotifyAuth.svelte";
    import Increment from "./Increment.svelte";
    import AddSong from "./addSong.svelte";
    import Cookies from "js-cookie";
    import {Leaderboard} from "./leaderboard.svelte.ts";
    
    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies

    let leaderboard = new Leaderboard();

    let userState = $state({
        state: 0
    });

    function setState(newState: number) {
        userState.state = newState;
    }



    
</script>

<SpotifyAuth />

<main>
    <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-black p-6">
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => setState(1)}> Tilføj </button>
    <button class="bg-blue-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onclick = {() => setState(2)}> Stem </button>
    {#if userState.state === 1}
        <AddSong leaderboard={leaderboard}/>
    {:else if userState.state === 2}
        <Increment />
    {/if}

    <h2>Leaderboard length: {leaderboard.map}</h2>
    <ul>
        {#if leaderboard.getLeaderboard().length === 0}
            <p>No songs in leaderboard</p>
        {:else}
            {#each leaderboard.getLeaderboard() as item}
                <li>
                    <p>{item.track.name}</p>
                    <p>{item.track.artists.map(artist => artist.name).join(", ")}</p>
                    <img src={item.track.album.images[0]?.url} alt={item.track.album.name} width="200" />
                    <p>{item.votes}</p>
                </li>
            {/each}
        {/if}
    </ul>
</div>
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