export let adminToken: string | "";

export function setAdminToken(token: string){
    adminToken = token;
}

export function getAdminToken(){
    return adminToken;
}