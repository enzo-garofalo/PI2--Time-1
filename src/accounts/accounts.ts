import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";

export namespace AccountsManager {

    export type userAccount = {
        id:number | undefined;
        name: string;
        email:string;
        password: string;
        birthdate: string;
    };

    //conexão com  o BD
    async function saveNewAccount(account:userAccount) {
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = await DataBaseManager.get_connection();

        await connection.execute(
            `INSERT INTO ACCOUNTS (ID, NAME, EMAIL, PASSWORD, BIRTHDATE) 
             VALUES (SEQ_ACCOUNTS.NEXTVAL, ${account.name}, ${account.email}, ${account.password}, ${account.password} );`
        );

        await connection.commit();
        await connection.close();
    }

    export const signUpHandler: RequestHandler = (req: Request, res: Response) => {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
    
        if(pName && pEmail && pPassword && pBirthdate){
            const newAccount: userAccount = {
                id: undefined,
                name: pName,
                email: pEmail,
                password: pPassword,
                birthdate: pBirthdate
            }
            saveNewAccount(newAccount);
            res.statusCode = 200;
            res.send("Nova conta adicionada.");
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }

    async function login(email:string, password: string) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = await DataBaseManager.get_connection();

        await connection.execute(
            'SELECT * FROM ACCOUNTS WHERE EMAIL = :email AND PASSWORD = :password',
            [email, password]
        );

        await connection.close();

    }

    export const loginHandler: RequestHandler = async (req: Request, res: Response) => {

        const pEmail = req.get('email');
        const pPassword = req.get('password');
        //var access: boolean = false;
        
        if(pEmail && pPassword){
            await login(pEmail, pPassword);
            res.statusCode = 200;
            res.send("Acesso Liberado.");
        }else{
            res.statusCode = 400;
            res.send("Formato de requisição inválido.");
        }  
    }
}