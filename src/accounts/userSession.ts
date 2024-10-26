export class userSession{
    private static instance: userSession;
    public email: string | null = null;
    public token: string | null = null;

    private constructor(){}

    static getInstance() :userSession{
        if (!userSession.instance){
            userSession.instance = new userSession();
        }
        return userSession.instance;        
    }

    setEmail(email: string){
        this.email = email;
    }
    setToken(token: string){
        this.token = token;
    }

    getEmail(): string |null{
        return this.email;
    }

    getToken(): string | null{
        return this.token
    }
}