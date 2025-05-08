import { readable, derived, writable } from 'svelte/store';
import { getServerAdminToken } from './api';

// Internal state
let currentToken = '';
let subscribers: Array<(token: string) => void> = [];
let refreshInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;
let refreshPromise: Promise<void> | null = null;

// Add token expiration tracking
let tokenExpiration: number | null = null;
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

// Add a ready state to track when the token is fully loaded
export const tokenReady = writable(false);

// Create a readable store for the token
export const adminToken = readable(currentToken, (set) => {
    // Add this subscriber to our list
    const updateToken = (token: string) => {
        set(token);
        // Set the token as ready when it's been successfully fetched
        tokenReady.set(true);
    };
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
    refreshAdminToken();
    
    // Increase refresh interval to 5 minutes
    refreshInterval = setInterval(refreshAdminToken, 5 * 60 * 1000);
    console.log('Token refresh initialized. Current token:', currentToken);
}

// Refresh the token from the server
async function refreshAdminToken(): Promise<void> {
    if (refreshPromise) return refreshPromise;
    
    // Check if token needs refresh
    if (tokenExpiration && Date.now() < tokenExpiration - TOKEN_REFRESH_BUFFER) {
        console.log('Token still valid, skipping refresh');
        return;
    }

    refreshPromise = (async () => {
        try {
            console.log('Refreshing admin token...');
            const tokenValue = await getServerAdminToken();
            
            // Handle direct token value instead of Response
            if (tokenValue === null) {
                console.warn('Failed to get admin token: null returned');
                return;
            }

            console.log('Token value received:', tokenValue);
            
            // Ensure we're handling a string token
            const tokenStr = typeof tokenValue === 'string' ? tokenValue : 
                (tokenValue && tokenValue.token ? tokenValue.token : '');
            
            if (!tokenStr) {
                console.warn('Invalid token format received');
                return;
            }
            
            if (tokenStr !== currentToken) {
                console.log('Token changed, updating from: ',
                    currentToken ? currentToken.substring(0, 5) + '...' : 'none',
                    ' to: ', tokenStr.substring(0, 5) + '...');
                
                currentToken = tokenStr;
                tokenExpiration = Date.now() + 3600 * 1000; // Set expiration 1 hour from now
                
                // Mark token as ready
                tokenReady.set(true);

                // Notify all subscribers of the new token
                subscribers.forEach(notify => notify(currentToken));
            } else {
                console.log('Token unchanged');
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
    
    // Mark the token as ready immediately when manually set
    tokenReady.set(true);
    subscribers.forEach(notify => notify(token));
}

// Utility function to manually refresh the token
export async function refreshToken(): Promise<boolean> {
    try {
        await refreshAdminToken();
        
        // If we have a token after refresh, force subscribe notification
        if (currentToken !== '') {
            // Explicitly notify all subscribers to ensure reactivity
            subscribers.forEach(notify => notify(currentToken));
            // Set the token as ready
            tokenReady.set(true);
            console.log('Token refreshed and notified subscribers:', currentToken.substring(0, 10) + '...');
            return true;
        }
        
        // If we get here, we failed to get or set a token
        console.error('Failed to refresh token - no token available');
        return false;
    } catch (error) {
        console.error('Error in manual token refresh:', error);
        return false;
    }
}

// Derived store that tells you if a token exists
export const hasAdminToken = derived(adminToken, $token => $token !== '');