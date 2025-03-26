<script lang="ts">
    import SpotifyAuth from "../spotifyAuth.svelte";
    import Cookies from "js-cookie";


    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
</script>

<SpotifyAuth />

<main class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-8 text-white">
    
</main>