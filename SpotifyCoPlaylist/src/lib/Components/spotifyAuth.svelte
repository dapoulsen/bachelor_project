<script lang="ts">
    import { onMount } from 'svelte';
    import Cookies from "js-cookie";
    import { 
        redirectToAuthCodeFlow, 
        clientId,
        getAccessToken,
        refreshAccessToken
    } from "$lib/script";
    let accessToken = Cookies.get("spotify_access_token") || ""; // Retrieve from cookies
    
    onMount(async () => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!accessToken || accessToken === "undefined") {
            if (!code) {
                redirectToAuthCodeFlow(clientId);
            } else {
                try {
                    let response = await getAccessToken(clientId, code);
                    accessToken = response.access_token;
                    // Cookies.set("spotify_access_token", accessToken, { expires: 1, secure: true, sameSite: "Strict" });
                } catch (error) {
                    console.error("Error fetching access token:", error);
                }
            }
        } else {
            try {
                // 🔄 Refresh token if expired
                accessToken = await refreshAccessToken(clientId) || accessToken;
                console.log("🔄 Updated access token:", accessToken);
            } catch (error) {
                console.error("❌ Error fetching favorite song:", error);
            }
        }
        
    });

    
</script>

