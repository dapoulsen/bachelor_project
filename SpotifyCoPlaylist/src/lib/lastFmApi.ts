const LastFmToken = "8312a84bae5bef9b6bbdc9ebad850454";

interface LastFmResponse {
    [key: string]: any;
}

interface SimilarTracksResponse {
    similartracks: {
        track: Array<{
            name: string;
            mbid?: string;
            match: string;
            url: string;
            streamable: {
                fulltrack: string;
                "#text": string;
            } | string;
            artist: {
                name: string;
                mbid?: string;
                url: string;
            };
            image: Array<{
                "#text": string;
                size: "small" | "medium" | "large";
            }>;
        }>;
    };
}

interface SearchTrackResponse {
    results: {
        "opensearch:Query": {
            "#text"?: string;
            role: string;
            searchTerms: string;
            startPage: string;
        };
        "opensearch:totalResults": string;
        "opensearch:startIndex": string;
        "opensearch:itemsPerPage": string;
        trackmatches: {
            track: Array<{
                name: string;
                artist: string;
                url: string;
                streamable: {
                    fulltrack: string;
                    "#text": string;
                } | string;
                listeners: string;
                image: Array<{
                    "#text": string;
                    size: "small" | "medium" | "large" | "extralarge";
                }>;
            }>;
        };
    };
}

async function fetchLastFmAPI(endpoint: string, method: string, body?: any): Promise<LastFmResponse> {
        const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=${endpoint}&api_key=${LastFmToken}&format=json`, {
                method,
                body: body ? JSON.stringify(body) : undefined
        });
        return await res.json();
}

async function getLastFmSimilarTrack(trackName: string, artistName: string): Promise<SimilarTracksResponse> {
        const formattedTrackName = encodeURIComponent(trackName);
        const formattedArtistName = encodeURIComponent(artistName);
        console.log("Formatted track name: ", formattedTrackName);
        console.log(formattedArtistName);
        
        const response = await fetchLastFmAPI(
                `track.getsimilar&artist=${formattedArtistName}&track=${formattedTrackName}&limit=5`,
                'GET'
        );

        console.log(response);
        return response as SimilarTracksResponse;
}

function getSimilarTrackName(similarTracks: SimilarTracksResponse): string[] {
        const tracks: string[] = [];
        similarTracks.similartracks.track.forEach((track) => {
                tracks.push(track.name);
        });
        return tracks;  
}

function getSimilarTrackArtist(similarTracks: SimilarTracksResponse): string[] {
        const artists: string[] = [];
        similarTracks.similartracks.track.forEach((track) => {
                artists.push(track.artist.name);
        });
        return artists;
}

// New helper function to get track matches (similarity scores)
function getSimilarTrackMatches(similarTracks: SimilarTracksResponse): number[] {
        const matches: number[] = [];
        similarTracks.similartracks.track.forEach((track) => {
                matches.push(parseFloat(track.match));
        });
        return matches;
}

// New helper function to get a more complete track info object
function getSimilarTracksInfo(similarTracks: SimilarTracksResponse): Array<{name: string, artist: string, match: number, url: string}> {
        return similarTracks.similartracks.track.map(track => ({
                name: track.name,
                artist: track.artist.name,
                match: parseFloat(track.match),
                url: track.url
        }));
}

async function getTrackTags(trackName: string, artistName: string): Promise<LastFmResponse> {
        const formattedTrackName = encodeURIComponent(trackName);
        const formattedArtistName = encodeURIComponent(artistName);
        const response = await fetchLastFmAPI(
                `track.gettoptags&artist=${formattedArtistName}&track=${formattedTrackName}`,
                'GET'
        );
        return response;
}

async function getTrackInfo(trackName: string, artistName: string): Promise<LastFmResponse> {
        const formattedTrackName = encodeURIComponent(trackName);
        const formattedArtistName = encodeURIComponent(artistName);
        const response = await fetchLastFmAPI(
                `track.getInfo&artist=${formattedArtistName}&track=${formattedTrackName}`,
                'GET'
        );
        return response;
}

async function searchForTrackLastFm(trackName: string): Promise<SearchTrackResponse> {
    const formattedTrackName = encodeURIComponent(trackName);
    const response = await fetchLastFmAPI(
        `track.search&track=${formattedTrackName}&limit=5`,
        'GET'
    );
    return response as SearchTrackResponse;
}

export function getLastFmToken(): string {
        return LastFmToken;
}   

// Export the functions for use in other files
export {
        getLastFmSimilarTrack,
        getSimilarTrackName,
        getSimilarTrackArtist,
        getSimilarTrackMatches,
        getSimilarTracksInfo,
        getTrackTags,
        getTrackInfo,
        searchForTrackLastFm
};

// Test the functions
// (async () => {
//         const trackName = "Shape of You";
//         const artistName = "Ed Sheeran";

//         const similarTracks = await getLastFmSimilarTrack(trackName, artistName);
//         console.log("Similar Tracks: ", similarTracks);

//         const similarTrackMatches = getSimilarTrackMatches(similarTracks);
//         console.log("Similar Track Matches: ", similarTrackMatches);

//         const similarTrackInfo = getSimilarTracksInfo(similarTracks);
//         console.log("Similar Track Info: ", similarTrackInfo);

//         // const trackTags = await getTrackTags(trackName, artistName);
//         // console.log("Track Tags: ", trackTags);

//         // const trackInfo = await getTrackInfo(trackName, artistName);
//         // console.log("Track Info: ", trackInfo);
// })();
