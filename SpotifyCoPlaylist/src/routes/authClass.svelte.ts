export class Auth{
    access_token = $state("");

    setToken(token:string){
        this.access_token = token;
    }

    getToken(){
        return this.access_token;
    }
}
