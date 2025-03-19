<script>
    import SpotifyAuth from "./spotifyAuth.svelte";
    import Increment from "./Increment.svelte";

    
</script>

<SpotifyAuth />

<main>
    <Increment />
</main>


<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #121212;
    }
</style>