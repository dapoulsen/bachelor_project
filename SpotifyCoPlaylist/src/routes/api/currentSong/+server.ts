import { json } from '@sveltejs/kit';
import { getCurrentSong, setCurrentSong, updateSongProgress, updatePlayingState, resetCurrentSong } from '$lib/Server/currentSong';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    try {
        const songState = await getCurrentSong();
        console.log('GET current-song:', songState.song ? '✅ Song exists' : '❌ No song');
        
        return json({
            currentSong: songState.song,
            progress_ms: songState.progress_ms,
            is_playing: songState.is_playing,
            status: songState.song ? 'active' : 'none'
        });
    } catch (error) {
        console.error('Error in GET current-song:', error);
        return json({ 
            currentSong: null, 
            progress_ms: 0,
            is_playing: false,
            status: 'error' 
        });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();

        if (!data || !data.song) {
            console.error('POST current-song: No song provided');
            return json({
                success: false,
                message: 'No song provided'
            });
        }

        console.log('POST current-song: Setting song:', data.song.name);
        const songState = await setCurrentSong(
            data.song, 
            data.progress_ms || 0,
            data.is_playing !== undefined ? data.is_playing : true
        );

        return json({
            success: true,
            currentSong: songState.song,
            progress_ms: songState.progress_ms,
            is_playing: songState.is_playing
        });
    } catch (error) {
        console.error('Error in POST current-song:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

// Delete endpoint to clear the current song
export const DELETE: RequestHandler = async () => {
    try {
        await resetCurrentSong();
        return json({
            success: true,
            message: 'Current song cleared'
        });
    } catch (error) {
        console.error('Error in DELETE current-song:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}


// Optional: Add PATCH endpoint for updating just progress or playing state
export const PATCH: RequestHandler = async ({ request }) => {
    try {
        const data = await request.json();
        
        if (data.progress_ms !== undefined) {
            await updateSongProgress(data.progress_ms);
        }
        
        if (data.is_playing !== undefined) {
            await updatePlayingState(data.is_playing);
        }

        const currentSongState = await getCurrentSong();
        
        return json({
            success: true,
            ...currentSongState
        });
    } catch (error) {
        console.error('Error in PATCH current-song:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

