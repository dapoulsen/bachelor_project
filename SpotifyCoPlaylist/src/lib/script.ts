import type { UserProfile, SpotifyTopTracksResponse, SpotifyTrack, SpotifySearchResponse } from "./types";

export const clientId = "1aacc1c2967a41b18cb20bfaeefe8ff2";
/*const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const favoriteSong = await fetchFavoriteTrack(accessToken);
    populateUI(profile);
    if(favoriteSong != null){
        populateFavoriteSong(favoriteSong);
    }
    playFavoriteSong(favoriteSong, accessToken);
} */

export async function redirectToAuthCodeFlow(clientId: string) {

    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "bachelor-project-ruddy.vercel.app");
    params.append("scope", "user-read-private user-read-email user-top-read user-modify-playback-state");
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

export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "bachelor-project-ruddy.vercel.app");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token: string): Promise<UserProfile> {
        const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

export async function fetchFavoriteTrack(token: string): Promise<SpotifyTrack | null> {
    const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1&offset=0", {
      method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error("Failed to fetch top tracks", response.status);
      return null;
    }
    
    const data: SpotifyTopTracksResponse = await response.json();
    return data.items[0]; // return the top (favorite) track
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
    return data.tracks.items;
}
  

export function populateFavoriteSong(track: SpotifyTrack) {
    const favoriteSongElement = document.getElementById("favoriteSong");
    if (!favoriteSongElement) return;
    
    favoriteSongElement.innerHTML = `
      <h2>${track.name}</h2>
      <p>Artist: ${track.artists.map(artist => artist.name).join(", ")}</p>
      <img src="${track.album.images[0]?.url}" alt="${track.album.name}" width="200" />
      <p>Album: ${track.album.name}</p>
      <p>Duration: ${track.duration_ms}</p>
    `;
  }

function populateUI(profile: UserProfile) {
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
}

export async function playFavoriteSong(favoriteSong: SpotifyTrack | null, token: string) {
    if (favoriteSong != null) {
        const response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${favoriteSong.uri}`, {
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
    } else {
        console.error("No favorite song provided");
    }

    console.log("Hejsa");
    console.log(favoriteSong?.uri);
}
