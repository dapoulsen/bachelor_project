<script lang="ts">
    import SpotifyAuth from "$lib/Components/spotifyAuth.svelte";
    import CurrentlyPlaying from "$lib/Components/CurrentlyPlaying.svelte";

    let currentTrack = $state({
        track: null,
        duration: 0
    });

</script>

<SpotifyAuth />

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    <CurrentlyPlaying />
</main>