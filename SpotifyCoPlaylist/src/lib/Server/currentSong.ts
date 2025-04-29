import type { SpotifyTrack } from "$lib/types";

let currentSong: SpotifyTrack | null = null;

export function setCurrentSong(song: SpotifyTrack): SpotifyTrack {
    console.log('Setting current song:', song);
    currentSong = song;
    return currentSong;
}

export function getCurrentSong(): SpotifyTrack | null {
    if (!currentSong) {
        console.log('No current song set.');
        return null;
    }
    console.log('Getting current song:', currentSong);
    return currentSong;
}
