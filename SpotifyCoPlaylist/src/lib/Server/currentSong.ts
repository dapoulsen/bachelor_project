import type { SpotifyTrack } from "$lib/types";

// Updated to include progress and playing state
interface CurrentSongState {
    song: SpotifyTrack | null;
    progress_ms: number;
    is_playing: boolean;
}

// Initialize with default values
const currentSongState: CurrentSongState = {
    song: null,
    progress_ms: 0,
    is_playing: false
};

export function setCurrentSong(song: SpotifyTrack, progress_ms: number = 0, is_playing: boolean = true): CurrentSongState {
    console.log('Setting current song:', song.name, 'Progress:', progress_ms, 'Playing:', is_playing);
    currentSongState.song = song;
    currentSongState.progress_ms = progress_ms;
    currentSongState.is_playing = is_playing;
    return currentSongState;
}

export function getCurrentSong(): CurrentSongState {
    if (!currentSongState.song) {
        console.log('No current song set.');
        return { song: null, progress_ms: 0, is_playing: false };
    }
    console.log('Getting current song:', currentSongState.song.name);
    return currentSongState;
}

export function updateSongProgress(progress_ms: number): void {
    if (currentSongState.song) {
        currentSongState.progress_ms = progress_ms;
    }
}

export function updatePlayingState(is_playing: boolean): void {
    if (currentSongState.song) {
        currentSongState.is_playing = is_playing;
    }
}
