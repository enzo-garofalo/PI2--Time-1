import {Request, RequestHandler, Response} from "express";
import {AccountsManager} from "./accounts";

export namespace accessSystem {

    export type userLogin = {
        email: string;
        password: string;
    };

    const allAccounts = AccountsManager.accountsDataBase;
    const qntAccounts = allAccounts.length;

    export const loginHandler: RequestHandler = (req: Request, res: Response) => {

        const pEmail = req.get('email');
        const pPassword = req.get('password');
        var access: boolean = false;
        
        if(pEmail && pPassword){
            const account: userLogin = {
                email: pEmail,
                password: pPassword
            }
            for (const account of allAccounts) {
                if (account.email === pEmail && account.password === pPassword) {
                    access = true;  // Retorna a conta se o login for válido
                    break;
                }
                
            }
            if(access){
                res.statusCode = 200;
                res.send("Acesso Liberado.");
            }else{
                res.statusCode = 400;
                res.send("Conta não encontrada.");
            }
            
        }else{
            res.statusCode = 400;
            res.send("Parametro invalidos");
        }

    }
}