import type { SpotifyTrack } from "$lib/types";

export async function getLeaderboard() {
    const res = await fetch("api/leaderboard");
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


 // Create a function to set admin token on the server
 export async function setServerAdminToken(token: string): Promise<boolean> {
    try {
        const response = await fetch('/api/admin-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            console.error('Failed to set admin token:', response.statusText);
            return false;
        }
        
        const data = await response.json();
        return data.success || false;
    } catch (error) {
        console.error('Error setting admin token:', error);
        return false;
    }
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