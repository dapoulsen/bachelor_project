<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";
    import { hasVotedForTrack, recordVote, getUserVoteForTrack } from "$lib/voteTracker";
    import { voteForTrack, getGenreTracker, getLeaderboard, addVotesToLeaderboard } from "$lib/api";
    import { logUserAction } from "$lib/clientLogger";
    import { getTrackTags, getTrackTopTags } from "$lib/lastFmApi";
    import VoteButton from "./VoteButton.svelte";

    export let track: SpotifyTrack;
    export let userId: string | null;
    export let refreshLeaderboard: () => Promise<void>;

    const userVote = getUserVoteForTrack(track.id);
    
    // Add debounce utility
    function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        
        return (...args: Parameters<F>) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    
    // Create debounced version of handleVote with genre logic
    const debouncedVote = debounce(async (track: SpotifyTrack, action: 'increment' | 'decrement') => {
        try {
            // Check if user already voted for this track
            if (hasVotedForTrack(track.id)) {
                console.log(`User already voted for track ${track.id}`);
                return;
            }
            
            // First register the standard vote
            console.log(`Voting ${action} for track ${track.id}`);
            const result = await voteForTrack(track.id, action);
            
            if (result) {
                recordVote(track.id, action);
                console.log('Vote recorded locally');
                
                // For upvotes, add additional genre-based votes
                if (action === 'increment') {
                    await addGenreBasedVotes(track);
                }
                
                await refreshLeaderboard();
            }
        } catch (error) {
            console.error('Error in handleVote:', error);
        }
    }, 300); // 300ms debounce
    
    // Add genre-based votes
    async function addGenreBasedVotes(track: SpotifyTrack) {
        try {
            // Get track tags from Last.fm
            const trackName = track.name;
            const artistName = track.artists[0]?.name || '';
            console.log('Fetching track tags for:', trackName, 'by', artistName);
            const trackTagsResponse = await getTrackTopTags(trackName, artistName);
            
            if (!trackTagsResponse?.toptags?.tag) {
                console.log('No tags found for track');
                return;
            }
            
            // Get current genre tracker data
            const genreResponse = await getGenreTracker();
            const genreTracker = genreResponse?.genreTracker;
            
            if (!genreTracker || genreTracker.length === 0) {
                console.log('No genre tracker data available');
                return;
            }
            
            console.log('Track tags:', trackTagsResponse.toptags.tag);
            console.log('Genre tracker:', genreTracker);
            
            // Find matching genres between track tags and genre tracker
            const matchingGenres = genreTracker.filter((genreItem: any) => 
                trackTagsResponse.toptags.tag.some((tag: any) => 
                    tag.name.toLowerCase() === genreItem.genre.toLowerCase()
                )
            );
            
            if (matchingGenres.length === 0) {
                console.log('No matching genres found for this track');
                return;
            }
            
            console.log('Matching genres:', matchingGenres);
            
            // Find the genre with the most votes
            const mostPopularGenre = matchingGenres.reduce((prev: any, current: any) => 
                (prev.votes > current.votes) ? prev : current
            );
            
            console.log('Most popular matching genre:', mostPopularGenre);
            
            // Add bonus votes based on genre popularity
            const bonusVotes = mostPopularGenre.votes;
            
            if (bonusVotes > 0) {
                console.log(`Adding ${bonusVotes} bonus votes based on genre popularity`);
                
                await addVotesToLeaderboard(track.id, bonusVotes);
            }

            // Add votes to tracks with matching genres
            await addVotesToTracksWithMatchingGenres(track);
        } catch (error) {
            console.error('Error adding genre-based votes:', error);
        }
    }
    
    async function addVotesToTracksWithMatchingGenres(track: SpotifyTrack) {
        // get track tags from Last.fm
        const trackName = track.name;
        const artistName = track.artists[0]?.name || '';

        const trackTagsResponse = await getTrackTopTags(trackName, artistName);
        if (!trackTagsResponse?.toptags?.tag) {
            console.log('No tags found for track');
            return;
        }

        // get leaderboard data
        const leaderboardResponse = await getLeaderboard();
        console.log('LEADERBOARD:', leaderboardResponse);
        const leaderboard = leaderboardResponse?.list || [];
        console.log('LEADERBOARD TRACKS:', leaderboard);
        if (!leaderboard || leaderboard.length === 0) {
            console.log('No leaderboard data available');
            return;
        }

        // Go through each track in the leaderboard
        for (const leaderboardTrack of leaderboard){
            // get track tags from Last.fm
            const leaderboardTrackName = leaderboardTrack.track.name;
            const leaderboardArtistName = leaderboardTrack.track.artists[0]?.name || '';

            console.log('Fetching tags for leaderboard track:', leaderboardTrackName, 'by', leaderboardArtistName);

            const leaderboardTrackTagsResponse = await getTrackTopTags(leaderboardTrackName, leaderboardArtistName);
            if (!leaderboardTrackTagsResponse?.toptags?.tag) {
                console.log('No tags found for leaderboard track');
                continue;
            }

            // Check if the genres match
            const matchingGenres = trackTagsResponse.toptags.tag.filter((tag: any) => 
                leaderboardTrackTagsResponse.toptags.tag.some((leaderboardTag: any) => 
                    tag.name.toLowerCase() === leaderboardTag.name.toLowerCase()
                )
            );

            if (matchingGenres.length > 0) {
                // Add a vote to the leaderboard track
                await voteForTrack(leaderboardTrack.id, 'increment');
                console.log(`Added a vote to ${leaderboardTrack.name} based on genre match`);
            }
        }
    }

    // Handle vote actions
    function handleUpvote() {
        // Log the vote action
        if (userId) {
            logUserAction(userId, 'vote', { 
                trackId: track.id,
                trackName: track.name,
                voteType: 'increment',
                sessionType: 'genre'
            });
        }
        
        debouncedVote(track, 'increment');
    }
    
    function handleDownvote() {
        // Log the vote action
        if (userId) {
            logUserAction(userId, 'vote', { 
                trackId: track.id,
                trackName: track.name,
                voteType: 'decrement',
                sessionType: 'genre'
            });
        }
        
        debouncedVote(track, 'decrement');
    }
</script>

<div class="flex space-x-4 justify-center w-full">
    <VoteButton track={track} action="increment" userVote={userVote} onClick={handleUpvote} />
    <VoteButton track={track} action="decrement" userVote={userVote} onClick={handleDownvote} />
</div>