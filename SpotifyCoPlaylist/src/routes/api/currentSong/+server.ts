import { json } from '@sveltejs/kit';
import { getCurrentSong, setCurrentSong } from '$lib/Server/currentSong';
import type { RequestHandler } from './$types';

export const   GET: RequestHandler = async () => {
    try {
        const song = getCurrentSong();
        console.log('GET current-song:', song ? '✅ Song exists' : '❌ No song');
        

        return json({
            currentSong: song || null,
            status: song ? 'active' : 'none'
        });
    } catch (error) {
        console.error('Error in GET current-song:', error);
        return json({ currentSong: null, status: 'error' });
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
        const song = setCurrentSong(data.song);

        return json({
            success: true,
            currentSong: song
        });
    } catch (error) {
        console.error('Error in POST current-song:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

