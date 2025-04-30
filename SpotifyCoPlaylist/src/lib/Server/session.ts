let session_isActive = false;

export function isSessionActive() {
    return session_isActive;
}

export function setSessionStatus(active: boolean) {
    session_isActive = active;
}