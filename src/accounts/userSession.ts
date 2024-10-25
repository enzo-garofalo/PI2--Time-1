export class userSession{
    private static instance: userSession;
    private email: string |null = null;
    public ID_User: number | null = null;

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
    setID(ID_User: number){
        this.ID_User = ID_User;
    }

    getEmail(): string |null{
        return this.email;
    }

    getID(): number | null{
        return this.ID_User
    }
}