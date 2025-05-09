/**
 * Client-side helper to log user actions
 */
export async function logUserAction(
    userId: string, 
    action: string, 
    metadata: Record<string, any> = {}
): Promise<boolean> {
    try {
        const response = await fetch('/api/log-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action, metadata })
        });
        
        if (!response.ok) {
            console.error('Failed to log action:', await response.text());
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error logging action:', error);
        return false;
    }
}