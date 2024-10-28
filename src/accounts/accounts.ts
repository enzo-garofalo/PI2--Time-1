import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";
import { FundsManager } from "../funds/funds";

export namespace AccountsManager {

    export type userAccount = {
        ID:number | undefined;
        NAME: string;
        EMAIL:string;
        PASSWORD: string;
        BIRTHDATE: string;
        ROLE: number;
        TOKEN: string | undefined;
    };

    export const signUpHandler: RequestHandler = 
    async (req: Request, res: Response) => 
    {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
    
        if(pName && pEmail && pPassword && pBirthdate){
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
            const newAccountWallet: FundsManager.Wallet =
            {
                idWallet: undefined,
                balance: 0
            }

            if( await DataBaseManager.saveNewAccount(newAccount, newAccountWallet))
            {
                res.statusCode = 200;
                res.send("Nova conta adicionada.");
            }else{
                res.statusCode = 409;
                res.send("Erro inesperado ao criar nova conta.")
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }

    async function login(email:string, password: string) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = await DataBaseManager.get_connection();

        const result: OracleDB.Result<{ TOKEN: string }> = await connection.execute(
            'SELECT TOKEN FROM ACCOUNTS WHERE EMAIL = :email AND PASSWORD = :password',
            {email, password}
        );

        await connection.close();
        return result.rows;
    }

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
        const result = await login(pEmail, pPassword);
        // Verifica se a função retornou algo mesmo!
        if(result && result.length > 0)
        {
            // iniciando session
            const account = await DataBaseManager.getUserByToken(result[0].TOKEN);
            // atribui token e cargo para a session
            if(account)
            {
                req.session.token = account[0].TOKEN;
                req.session.role = account[0].ROLE;
            } 
            res.statusCode = 200;
            res.send(`Acesso Liberado.\nBem Vindo`);
        }else{
            // Esse 401 é de não autorizado
            res.statusCode = 401;
            res.send(`Nome ou Senha Incorretos!`);
        }
    }
}