import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getGenreTrackerData, addVotesToGenreFromTrack, clearGenreTracker } from '$lib/Server/genreTracker';

export const GET: RequestHandler = async () => {
    try {
        const genreTracker = await getGenreTrackerData();
        console.log('GET genre-tracker:', genreTracker);
        return json({
            success: true,
            genreTracker
        });
    } catch (error) {
        console.error('Error in GET genre-tracker:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

export const POST: RequestHandler = async ({ request}) => {
    try {
        const data = await request.json();

        if (!data || !data.toptags.tag) {
            console.error('POST genre-tracker: No tags provided');
            return json({
                success: false,
                message: 'No tags provided'
            });
        }

        const tags = data;
        console.log('POST genre-tracker: Adding votes for tags:', tags);
        await addVotesToGenreFromTrack(tags);
        return json({
            success: true,  
            message: 'Votes added successfully'
        });
    } catch (error) {
        console.error('Error in POST genre-tracker:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}

export const DELETE: RequestHandler = async () => {
    try {
        console.log('DELETE genre-tracker: Clearing genre tracker');
        await clearGenreTracker();
        return json({
            success: true,
            message: 'Genre tracker cleared successfully'
        });
    } catch (error) {
        console.error('Error in DELETE genre-tracker:', error);
        return json({
            success: false,
            message: 'Server error'
        });
    }
}