import {Request, RequestHandler, Response} from "express";

import { DataBaseManager } from "../db/connection";
import { dbAccountsManager } from "./databaseAccounts";

import { FundsManager } from "../funds/funds";

/*arquivo .ts relacionado a contas*/

export namespace AccountsManager {

    /*Criação do type para contas*/
    export type userAccount = {
        ID:number | undefined;
        NAME: string;
        EMAIL:string;
        PASSWORD: string;
        BIRTHDATE: string;
        ROLE: number;
        TOKEN: string | undefined;
    };

    /* 
        Recebe requisição e trata os dados e 
        coloca em nova conta e cria uma carteira vazia
    */

    export const signUpHandler: RequestHandler = 
    async (req: Request, res: Response) => 
    {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
    
        if(pName && pEmail && pPassword && pBirthdate){
            
            const verify = await dbAccountsManager.verifyEmail(pEmail);

            if(verify)
            {
                console.log(verify)
                if(!verify[0]){
                    
                    const newAccount: userAccount = 
                    {
                        ID: undefined,
                        NAME: pName,
                        EMAIL: pEmail,
                        PASSWORD: pPassword,
                        BIRTHDATE: pBirthdate,
                        ROLE: 0,
                        TOKEN: undefined
                    }
                    const newAccountFunds: FundsManager.Wallet =
                    {
                        idWallet: undefined,
                        balance: 0
                    }

                    if( await dbAccountsManager.saveNewAccount(newAccount, newAccountFunds))
                    {
                        res.statusCode = 200;
                        res.send("Nova conta adicionada.");
                    }else{
                        res.statusCode = 409;
                        res.send("Erro inesperado ao criar nova conta.")
                    }
                }else{
                    res.statusCode = 400;
                    res.send("Email já cadastrado!");
                }
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }


    /*
        Recebe email e senha e faz o login
        colocamos função para armazenar token e regra do negócio
        1(ADM do sistema) / 0 (Usuário comum)
    */
    
    export const loginHandler: RequestHandler = 
    async (req: Request, res: Response) => 
    {
        const pEmail = req.get('email');
        const pPassword = req.get('password');

        if(!pEmail || !pPassword)
        {
            res.statusCode = 400;
            res.send("Formato de requisição inválido.");
            return;
        }
        const result = await dbAccountsManager.login(pEmail, pPassword);
        if(result && result.length > 0)
        {

            const account = 
            await DataBaseManager.getUserByToken(result[0].TOKEN);

            if(account)
            {
                req.session.token = account[0].TOKEN;
                req.session.role = account[0].ROLE;
            } 
            
            res.statusCode = 200;
            res.send(`Acesso Liberado.\nBem Vindo`);
        }else{
            res.statusCode = 401;
            res.send(`Nome ou Senha Incorretos!`);
        }
    }
}