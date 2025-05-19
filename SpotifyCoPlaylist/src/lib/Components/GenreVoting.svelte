<script lang="ts">
    import type { SpotifyTrack } from "$lib/types";
    import { hasVotedForTrack, recordVote, getUserVoteForTrack } from "$lib/voteTracker";
    import { voteForTrack, getGenreTracker, getLeaderboard, addVotesToLeaderboard } from "$lib/api";
    import { logUserAction } from "$lib/clientLogger";
    import { getTrackTopTags } from "$lib/lastFmApi";
    import VoteButton from "./VoteButton.svelte";

    const { track, userId, refreshLeaderboard } = $props<{
        track: SpotifyTrack;
        userId: string | null;
        refreshLeaderboard: () => Promise<void>;
    }>();
    
    // Make userVote reactive so it updates when the vote changes
    let userVote = $state(getUserVoteForTrack(track.id));
    let processingVote = $state(false);
    let processingGenres = $state(false);
    
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

            processingVote = true;
            
            // First register the standard vote
            console.log(`Voting ${action} for track ${track.id}`);
            const result = await voteForTrack(track.id, action);
            
            if (result) {
                recordVote(track.id, action);
                // Update the userVote state to reflect the new vote
                userVote = action;
                console.log('Vote recorded locally');
                
                // For upvotes, add additional genre-based votes
                if (action === 'increment') {
                    processingGenres = true;
                    await addGenreBasedVotes(track);
                    processingGenres = false;
                } else if (action === 'decrement') {
                    // For downvotes, remove genre-based votes
                    await removeGenreBasedVotes(track);
                }
                
                await refreshLeaderboard();
            }
        } catch (error) {
            console.error('Error in handleVote:', error);
        } finally {
            processingVote = false;
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
                await voteForTrack(leaderboardTrack.track.id, 'increment');
                console.log(`Added a vote to ${leaderboardTrackName} based on genre match`);
            }
        }
    }

    async function removeGenreBasedVotes(track: SpotifyTrack) {
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
                await voteForTrack(leaderboardTrack.track.id, 'decrement');
                console.log(`Added a vote to ${leaderboardTrackName} based on genre match`);
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

<div class="flex flex-col items-center w-full mb-2">
    {#if processingVote}
        <div class="text-sm text-yellow-400 font-medium animate-pulse">
            {#if processingGenres}
                Finding similar genres...
            {:else}
                Voting...
            {/if}
        </div>
    {/if}
</div>


<div class="flex space-x-4 justify-center w-full">
    <VoteButton track={track} action="increment" userVote={userVote} onClick={handleUpvote} disabled={processingVote} />
    <VoteButton track={track} action="decrement" userVote={userVote} onClick={handleDownvote} disabled={processingVote} />
</div>