import { readable, derived } from 'svelte/store';

// Internal state
let currentToken = '';
let subscribers: Array<(token: string) => void> = [];
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;
let refreshPromise: Promise<void> | null = null;

// Create a readable store for the token
export const adminToken = readable('', (set) => {
    // Add this subscriber to our list
    const updateToken = (token: string) => set(token);
    subscribers.push(updateToken);
    
    // Initialize if this is the first subscriber
    if (!isInitialized) {
        initializeTokenRefresh();
    } else {
        // If already initialized, do an initial refresh
        updateToken(currentToken);
    }
    
    // Return the unsubscribe function
    return () => {
        subscribers = subscribers.filter(sub => sub !== updateToken);
        
        // If no more subscribers, clean up the interval
        if (subscribers.length === 0 && refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            isInitialized = false;
        }
    };
});

// Initialize the token refresh mechanism
function initializeTokenRefresh() {
    if (isInitialized) return;
    
    isInitialized = true;
    
    // Do an initial refresh
    refreshAdminToken();
    
    // Set up the refresh interval
    refreshInterval = setInterval(refreshAdminToken, 30000); // Refresh every 30 seconds

    console.log('Token refresh initialized. Current token:', currentToken);
}

// Refresh the token from the server
async function refreshAdminToken(): Promise<void> {
    //If there is already a refresh in progress, return that promise
    if (refreshPromise) return refreshPromise;
    
    refreshPromise = (async () => {
        try {
            console.log('Refreshing admin token...');
            const response = await fetch('/api/admin-token');
            if (!response.ok) {
                console.warn('Failed to get admin token:', response.statusText);
                return;
            }
            
            const data = await response.json();
            
            if (data && data.token) {
                if (data.token !== currentToken) {
                console.log('Token changed, updating from: ',
                    currentToken ? currentToken.substring(0, 5) + '...' : 'none',
                    ' to: ', data.token.substring(0, 5) + '...');
                
                currentToken = data.token;

                // Notify all subscribers of the new token
                subscribers.forEach(notify => notify(currentToken));
                } else {
                    console.log('Token unchanged');
                }
            } else {
                console.warn('No token found in API response:', data);
                if (currentToken) {
                    currentToken = '';
                    subscribers.forEach(notify => notify(''));
                    console.log('Token cleared due to empty response');
                }
            }


        } catch (error) {
            console.error('Error refreshing admin token:', error);
        } finally {
            refreshPromise = null; // Reset the promise
        }
    })();

    return refreshPromise;
}

// Force set the token (for direct API integration)
export function forceSetToken(token: string): void {
    if (!token) {
        console.warn('Attempted to force set empty token');
        return;
    }
    
    console.log('Force setting token to:', token.substring(0, 5) + '...');
    currentToken = token;
    subscribers.forEach(notify => notify(token));
}

// Utility function to manually refresh the token
export async function refreshToken(): Promise<boolean> {
    try {
        await refreshAdminToken();
        return currentToken !== '';
    } catch (error) {
        console.error('Error in manual token refresh:', error);
        return false;
    }
}
// Add a debug function to help troubleshoot
export function debugTokenState() {
    console.log({
        currentToken: currentToken ? '✅ Set' : '❌ Not set',
        tokenValue: currentToken ? `${currentToken.substring(0, 5)}...` : 'none',
        subscriberCount: subscribers.length,
        isInitialized,
        hasInterval: refreshInterval !== null
    });
}

// Derived store that tells you if a token exists
export const hasAdminToken = derived(adminToken, $token => $token !== '');