/**
 * Utility to track and manage user votes using localStorage
 */

const VOTE_STORAGE_KEY = 'spotify_coplaylist_votes';

interface VoteRecord {
  trackId: string;
  action: 'increment' | 'decrement';
  timestamp: number;
}

/**
 * Get all votes the user has cast
 */
export function getUserVotes(): VoteRecord[] {
  try {
    const voteData = localStorage.getItem(VOTE_STORAGE_KEY);
    if (!voteData) return [];
    
    return JSON.parse(voteData);
  } catch (error) {
    console.error('Error getting user votes from localStorage:', error);
    return [];
  }
}

/**
 * Check if the user has already voted for this track
 */
export function hasVotedForTrack(trackId: string): boolean {
  const votes = getUserVotes();
  return votes.some(vote => vote.trackId === trackId);
}

/**
 * Record a vote for a track
 */
export function recordVote(trackId: string, action: 'increment' | 'decrement'): void {
  try {
    // Get existing votes
    const votes = getUserVotes();
    
    // Don't add duplicate votes
    if (votes.some(vote => vote.trackId === trackId)) {
      return;
    }
    
    // Add new vote
    votes.push({
      trackId,
      action,
      timestamp: Date.now()
    });
    
    // Save back to localStorage
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(votes));
  } catch (error) {
    console.error('Error recording vote:', error);
  }
}

/**
 * Clear all vote history (useful for testing)
 */
export function clearVoteHistory(): void {
  localStorage.removeItem(VOTE_STORAGE_KEY);
}

/**
 * Get which action the user took for a specific track
 * Returns the action or null if user hasn't voted
 */
export function getUserVoteForTrack(trackId: string): 'increment' | 'decrement' | null {
  const votes = getUserVotes();
  const vote = votes.find(v => v.trackId === trackId);
  return vote ? vote.action : null;
}