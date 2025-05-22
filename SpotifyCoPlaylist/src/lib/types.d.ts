export interface UserProfile {
    country: string;
    display_name: string;
    email: string;
    explicit_content: {
        filter_enabled: boolean,
        filter_locked: boolean
    },
    external_urls: { spotify: string; };
    followers: { href: string; total: number; };
    href: string;
    id: string;
    images: Image[];
    product: string;
    type: string;
    uri: string;
}

export interface Image {
    url: string;
    height: number;
    width: number;
}

// spotify.d.ts

export interface SpotifyTopTracksResponse {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    href: string;
    previous: string | null;
    next: string | null;
}
  
export interface SpotifyTrack {
    album: SpotifyAlbum;
    artists: SpotifyArtist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
      isrc: string;
    };
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    is_local: boolean;
    name: string;
    popularity: number;
    preview_url: string | null;
    track_number: number;
    type: string;
    uri: string;
}
  
export interface SpotifyAlbum {
    album_type: string;
    artists: SpotifyArtist[];
    available_markets: string[];
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
}
  
export interface SpotifyArtist {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}
  
export interface SpotifyImage {
    height: number;
    url: string;
    width: number;
}
  
export interface SpotifySearchResponse {
  tracks: {
    href: string,
    limit: number,
    next: string,
    offset: number,
    previous: string,
    total: number,
    items: [
      {
        album: {
          album_type: string,
          total_tracks: number,
          available_markets: [
            string,
            string,
            string
          ],
          external_urls: {
            spotify: string
          },
          href: string,
          id: string,
          images: [
            {
              url: string,
              height: number,
              width: number
            }
          ],
          name: string,
          release_date: string,
          release_date_precision: string,
          restrictions: {
            reason: string
          },
          type: string,
          uri: string,
          artists: [
            {
              external_urls: {
                spotify: string
              },
              href: string,
              id: string,
              name: string,
              type: string,
              uri: string
            }
          ]
        },
        artists: [
          {
            external_urls: {
              spotify: string
            },
            href: string,
            id: string,
            name: string,
            type: string,
            uri: string
          }
        ],
        available_markets: [
          string
        ],
        disc_number: number,
        duration_ms: number,
        explicit: boolean,
        external_ids: {
          isrc: string,
          ean: string,
          upc: string
        },
        external_urls: {
          spotify: string
        },
        href: string,
        id: string,
        is_playable: boolean,
        linked_from: {},
        restrictions: {
          reason: string
        },
        name: string,
        popularity: number,
        preview_url: string,
        track_number: number,
        type: string,
        uri: string,
        is_local: boolean
      }
    ]
}
}

export interface SpotifyPlayerResponse {
  device: {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
    supports_volume: boolean;
  };
  repeat_state: string;
  shuffle_state: boolean;
  context: {
    type: string;
    href: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  };
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: {
    album: {
      album_type: string;
      total_tracks: number;
      available_markets: string[];
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      images: {
        url: string;
        height: number;
        width: number;
      }[];
      name: string;
      release_date: string;
      release_date_precision: string;
      restrictions?: {
        reason: string;
      };
      type: string;
      uri: string;
      artists: {
        external_urls: {
          spotify: string;
        };
        href: string;
        id: string;
        name: string;
        type: string;
        uri: string;
      }[];
    };
    artists: {
      external_urls: {
        spotify: string;
      };
      href: string;
      id: string;
      name: string;
      type: string;
      uri: string;
    }[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: {
      isrc: string;
      ean: string;
      upc: string;
    };
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    is_playable: boolean;
    linked_from?: object;
    restrictions?: {
      reason: string;
    };
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
    is_local: boolean;
  };
  currently_playing_type: string;
  actions: {
    interrupting_playback: boolean;
    pausing: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
    toggling_repeat_context: boolean;
    toggling_shuffle: boolean;
    toggling_repeat_track: boolean;
    transferring_playback: boolean;
  };
}
