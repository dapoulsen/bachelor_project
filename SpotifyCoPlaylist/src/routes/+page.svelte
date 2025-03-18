<script>
    import SpotifyAuth from "./spotifyAuth.svelte";
    import Increment from "./Increment.svelte";

    
</script>

<SpotifyAuth />



<Increment /> 


<style lang="postcss">
    @reference "tailwindcss";

    :global(html) {
        background-color: #dbd1d1;
    }
</style>