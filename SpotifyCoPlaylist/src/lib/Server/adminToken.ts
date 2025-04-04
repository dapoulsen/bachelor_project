let adminToken = "";

export function setAdminToken(token: string): string {
    console.log('Setting admin token:', token);
    adminToken = token;
    return adminToken;
}

export function getAdminToken(): string {
    console.log('Getting admin token:', adminToken);
    return adminToken;
}

export function clearAdminToken(): void{
    console.log('Clearing admin token');
    adminToken= '';
}