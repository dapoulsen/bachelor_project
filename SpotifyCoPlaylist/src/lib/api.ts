import type { SpotifyTrack } from "$lib/types";
import { error } from "@sveltejs/kit";
import { forceSetToken } from "./adminTokenManager";

export async function getLeaderboard() {
    const res = await fetch("api/leaderboard", {
        method: "GET"
    });
    return await res.json();
}

export async function initializeLeaderboard() {
    const res = await fetch("api/leaderboard", {
        method: "POST"
    });
    return await res.json();
}

export async function resetLeaderboard() {
    const res = await fetch("api/leaderboard/reset", {
        method: "POST"
    });
    return await res.json();
}

export async function addToLeaderboard(track: SpotifyTrack) {
    const res = await fetch("api/leaderboard/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(track)
    });
    return await res.json();
}

export async function removeFromLeaderboard(trackId: string) {
    const res = await fetch("api/leaderboard/remove", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: trackId })
    });
    return await res.json();
}

export async function voteForTrack(trackId: string, action: 'increment' | 'decrement') {
    try {
        const response = await fetch('/api/leaderboard/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: trackId, action })
        });
        
        if (!response.ok) {
            console.error('Failed to vote for track:', await response.text());
            throw new Error('Failed to vote for track');
        } else {
            console.log('Voted for track successfully!');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error voting for track:', error);
        throw error;
    }
}

export async function addVotesToLeaderboard(trackId: string, votes: number) {
    try {
        const response = await fetch('/api/leaderboard/vote/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ trackId, votes })
        });
        if (!response.ok) {
            console.error('Failed to add votes to leaderboard:', await response.text());
            throw new Error('Failed to add votes to leaderboard');
        } else {
            console.log('Added votes to leaderboard successfully!');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding votes to leaderboard:', error);
        throw error;
    }
}

export async function getCurrentSong(token: string): Promise<SpotifyTrack | null> {
    try {
        const response = await fetch ('/api/currentSong', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            console.error('Failed to fetch current song:', response.statusText);
            return null;
        }
        const data = await response.json();
        return data.currentSong || null;

    } catch (error) {
        console.error('Error fetching current song:', error);
        return null;
    }
    
}

export async function setCurrentSong(song: SpotifyTrack): Promise<SpotifyTrack | null> {
    try {
        const response = await fetch('/api/currentSong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(song)
        });
        if (!response.ok) {
            console.error('Failed to set current song:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('Current song set successfully:', data);
        return data.success || false;
        }catch (error) {
            console.error('Error setting current song:', error);
            return null;
        }
}

export async function clearCurrentSong(): Promise<boolean> {
    try {
        const response = await fetch('/api/currentSong', {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error('Failed to clear current song:', response.statusText);
            return false;
        }
        
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Error clearing current song:', error);
        return false;
    }
}

export async function getServerAdminToken() {
    try {
        const response = await fetch('/api/admin-token', {
            method: 'GET'
        });
        
        if (!response.ok) {
            console.error('Failed to get admin token:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return {
            token: data.token,
            expiresIn: data.expires_in || 3600 // Default 1 hour if not specified
        };
    } catch (error) {
        console.error('Error getting admin token:', error);
        return null;
    }
}

// Create a function to set admin token on the server and client
export async function setAdminToken(token: string): Promise<boolean> {
    try {
        // First update server
        const response = await fetch('/api/admin-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            console.error('Failed to set admin token on server:', response.statusText);
            return false;
        }
        
        // Then update client immediately
        forceSetToken(token);
        
        console.log('Admin token set on both server and client');
        return true;
    } catch (error) {
        console.error('Error setting admin token:', error);
        return false;
    }
}

// Keep the original functions but update setServerAdminToken to use the new combined function
export async function setServerAdminToken(token: string): Promise<boolean> {
    return setAdminToken(token);
}

// Create a function to clear the token on the server
export async function clearServerAdminToken(): Promise<boolean> {
    try {
        const response = await fetch('/api/admin-token', { 
            method: 'DELETE' 
        });
        
        if (!response.ok) {
            console.error('Failed to clear admin token:', response.statusText);
            return false;
        }
        
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Error clearing admin token:', error);
        return false;
    }
}

export async function getSessionStatus() {
    try {
        const response = await fetch('/api/session', {
            method: 'GET'
        });
        
        if (!response.ok) {
            console.error('Failed to get session status:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return data.session || null;
    } catch (error) {
        console.error('Error getting session status:', error);
        return null;
    }
}

export async function setSessionStatus(session: 'active' | 'inactive') {
    try {
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session })
        });
        
        if (!response.ok) {
            console.error('Failed to set session status:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return data.session || null;
    } catch (error) {
        console.error('Error setting session status:', error);
        return null;
    }
}

export async function getSessionType() {
    try {
        const response = await fetch('/api/session/type', {
            method: 'GET'
        });
        
        if (!response.ok) {
            console.error('Failed to get session type:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return data.sessionType || null;
    } catch (error) {
        console.error('Error getting session type:', error);
        return null;
    }
}

export async function setSessionType(sessionType: 'normal' | 'genre'){
    try {
        const response = await fetch('/api/session/type', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionType })
        });
        
        if (!response.ok) {
            console.error('Failed to set session type:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return data.sessionType || null;
    } catch (error) {
        console.error('Error setting session type:', error);
        return null;
    }
}

export async function clearSessionType() {
    try {
        const response = await fetch('/api/session/type', {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            console.error('Failed to clear session type:', response.statusText);
            return null;
        }
        
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('Error clearing session type:', error);
        return null;
    }
}

/**
 * Verify the admin password with the server
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        if (!response.ok) {
            console.error('Failed to verify password:', response.statusText);
            return false;
        }
        
        const data = await response.json();
        localStorage.setItem("adminPasswordVerified", "true"); // Store in local storage
        return data.success === true;
    } catch (error) {
        console.error('Error verifying admin password:', error);
        return false;
    }
}

/**
 * Check if the user is currently verified as admin
 */
export function isAdminVerified(): boolean {
    return localStorage.getItem('adminPasswordVerified') === 'true';
}

/**
 * Clear the admin verification status
 */
export function clearAdminVerification(): void {
    localStorage.removeItem('adminPasswordVerified');
}

export async function getGenreTracker() {
    try {
        const res = await fetch("api/genreTracker", {
        method: "GET"
        });

        console.log('GET genre-tracker:', res);
        // Check if the response is ok
        if (!res.ok) {
            console.error('Failed to fetch genre tracker:', res.statusText);
            return null;
        }
        
        return await res.json();
    } catch (error) {
        console.error('Error fetching genre tracker:', error);
        return null;
    }
}

export async function addVotesToGenreFromTrack(tags: any[]) {
    try {
        console.log('Adding votes to genre:', tags);
        const res = await fetch("api/genreTracker", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tags)
        });

        if (!res.ok) {
            console.error('Failed to add votes to genre:', res.statusText);
            return null;
        }
        
        return await res.json();
    } catch (error) {
        console.error('Error adding votes to genre:', error);
        return null;
    } 
}

export async function clearGenreTracker() {
   try {
        const res = await fetch("api/genreTracker", {
            method: "DELETE"
        });

        if (!res.ok) {
            console.error('Failed to clear genre tracker:', res.statusText);
            return null;
        }
        
        return await res.json();
    } catch (error) {
        console.error('Error clearing genre tracker:', error);
        return null;
    } 
}