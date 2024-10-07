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
        // Passo 1 - Receber os parametros para criar a conta
        
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        var access: boolean = false;

        if(pEmail && pPassword){
            const account: userLogin = {
                email: pEmail,
                password: pPassword
            }
            function verifyAccount(email: string, password: string){
                for (let i = 0; i < qntAccounts; i++) {
                    if (account.email === allAccounts[i].email && account.password === allAccounts[i].password) {
                        res.statusCode = 200;
                        res.send("Acesso Liberado");
                    }
                }
                return null;  // Retorna null se não encontrar correspondência
            }
            
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos.");
        }
    }
}