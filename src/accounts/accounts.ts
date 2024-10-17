import {Request, RequestHandler, Response} from "express";

export namespace AccountsManager {

    export type userAccount = {
        name: string;
        email:string;
        password: string;
        birthdate: string;
    };

    export let accountsDataBase: userAccount [] = []; //provávelmente será aqui implementado o Banco de dados.

    function saveNewAccount(ua: userAccount) : number {
        accountsDataBase.push(ua);
        return accountsDataBase.length;
    }

    export const signUpHandler: RequestHandler = (req: Request, res: Response) => {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
    
        if(pName && pEmail && pPassword && pBirthdate){
            const newAccount: userAccount = {
                name: pName,
                email: pEmail,
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount);
            res.statusCode = 200;
            res.send(`Nova conta adicionada. Código da conta: ${ID}`);
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }

    export const loginHandler: RequestHandler = (req: Request, res: Response) => {

        const pEmail = req.get('email');
        const pPassword = req.get('password');
        var access: boolean = false;
        
        if(pEmail && pPassword){
            
            for (const account of accountsDataBase) {
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