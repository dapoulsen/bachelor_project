import type { UserProfile, SpotifyTopTracksResponse, SpotifyTrack, SpotifySearchResponse } from "./types";
import Cookies from "js-cookie"; // Install with `npm install js-cookie`

export const clientId = "1aacc1c2967a41b18cb20bfaeefe8ff2";
let currentSong: SpotifyTrack | null = null;


export async function redirectToAuthCodeFlow(clientId: string) {

    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    Cookies.set("verifier", verifier, { expires: 1, secure: true, sameSite: "Strict" });
    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://bachelor-project-ruddy.vercel.app/admin");
    params.append("scope", "user-read-private user-read-email user-top-read user-modify-playback-state user-read-currently-playing user-read-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}


function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
} 

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<{ access_token: string, refresh_token: string }> {
    const verifier = Cookies.get("verifier"); // Retrieve the stored verifier
    if (!verifier) {
        console.error("🚨 Missing code verifier from cookies");
        throw new Error("No verifier found in cookies.");
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "https://bachelor-project-ruddy.vercel.app/admin");
    params.append("code_verifier", verifier);

    console.log("🔄 Fetching access token from Spotify...");

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!result.ok) {
        console.error("🚨 Failed to fetch access token:", result.status);
        throw new Error(`Failed to get access token. Status: ${result.status}`);
    }

    const data = await result.json();
    console.log("✅ Successfully received tokens:", data);

    // Store both tokens
    Cookies.set("spotify_access_token", data.access_token, { expires: 1 / 24, sameSite: "Strict" }); // Expires in 1 hour
    Cookies.set("spotify_refresh_token", data.refresh_token, { expires: 30, sameSite: "Strict" }); // Expires in 30 days

    return { access_token: data.access_token, refresh_token: data.refresh_token };
}


export async function searchForSong(token: string, searchKey: string){
    console.log(token);
    const response = await fetch(`https://api.spotify.com/v1/search?q=${searchKey}&type=track&limit=5`, 
        {method: "GET", headers: {Authorization: `Bearer ${token}`}
    });
    if (!response.ok) {
        console.error("Failed to search for song", response.status);
        return null;
    }

    const data = await response.json();
    return data;
}
  

export async function queueSelectedSong(song: SpotifyTrack | null, token:string) {
    if (song != null) {
        const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${song.uri}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            console.error("Failed to add song to queue:", await response.json());
        } else {
            console.log("Song added to queue successfully!");
        }
    }   
    else {
        console.error("No song provided to queue");
    }
}

export function getStoredAccessToken(): string | null {
    return Cookies.get("spotify_access_token") || null;
}

export async function refreshAccessToken(clientId: string): Promise<string | null> {
    const refreshToken = Cookies.get("spotify_refresh_token");

    if (!refreshToken) {
        console.error("❌ No refresh token found. User must log in again.");
        return null; // User needs to log in again
    }

    console.log("🔄 Refreshing access token...");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!result.ok) {
        console.error("🚨 Failed to refresh access token:", result.status);
        return null;
    }

    const data = await result.json();
    console.log("✅ New access token received:", data.access_token);

    // Store the new access token
    Cookies.set("spotify_access_token", data.access_token, { expires: 1 / 24, sameSite: "Strict" });

    return data.access_token;
}

export async function fetchCurrentTrack(token: string): Promise<{
    item: SpotifyTrack,
    progress_ms: number,
    is_playing: boolean
} | null> {
    try {
        const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });
    
        if (response.status === 204) {
            // No content - nothing is playing
            console.log("No track currently playing");
            return null;
        }
    
        if (!response.ok) {
            console.error("Failed to fetch current track", response.status);
            return null;
        }
    
        const data = await response.json();

        // Check if the response already has the structure we expect
        if (data.item && data.progress_ms !== undefined) {
            return data;
        }
        
        // If response is directly a track (no item wrapper)
        if (data.id && data.duration_ms) {
            if (!data.item === currentSong)
            
            // Create the expected structure
            return {
                item: data,
                progress_ms: 0, // Default to start of track
                is_playing: true // Default to playing
            };
            
        }
        
        console.error("Unexpected API response format:", data);
        return null;
    } catch (error) {
        console.error("Error fetching current track:", error);
        return null;
    }
    
}


export async function skipSong(token:string) {
    const response = await fetch(`https://api.spotify.com/v1/me/player/next`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });   

    if (!response.ok) {
        console.error("Failed to skip song:", await response.json());
    } else {
        console.log("Song skipped successfully!");
    }
}

export async function playOrPause(token:string, isPlaying:boolean) {
    const response = await fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        console.error("Failed to play/pause:", await response.json());
    } else {
        console.log("Playback toggled successfully!");
    }
}

