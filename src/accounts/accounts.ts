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
        role: number;
    };

    //conexão com  o BD
    async function saveNewAccount(account:userAccount) {
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = await DataBaseManager.get_connection();
        // Precisei colocar o insert de maneira diferente, com chaves, daquele
        // outro jeito não rolava!!
        await connection.execute(
            `INSERT INTO ACCOUNTS (ID, COMPLETE_NAME, EMAIL, PASSWORD, BIRTHDATE, ROLE) 
             VALUES (SEQ_ACCOUNTS.NEXTVAL, :name, :email, :password, :birthdate, :role)`,
            {
                name: account.name,
                email: account.email,
                password: account.password,
                birthdate: account.birthdate,
                role: account.role
            }
        );

        await connection.commit();
        await connection.close();
    }

    export const signUpHandler: RequestHandler = async (req: Request, res: Response) => {
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
                birthdate: pBirthdate,
                role: 0
            }
            // Precisei colocar um await aqui
            await saveNewAccount(newAccount);
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

        const account = await connection.execute(
            'SELECT * FROM ACCOUNTS WHERE EMAIL = :email AND PASSWORD = :password',
            {email, password}
        );

        await connection.close();
        // Fiz a função retornar as linhas que encontrou
        return account.rows;
    }

    export const loginHandler: RequestHandler = async (req: Request, res: Response) => {
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        
        if(!pEmail || !pPassword){
            res.statusCode = 400;
            res.send("Formato de requisição inválido.");
            return;
        }
        
        const account = await login(pEmail, pPassword);
        // Verifica se a função retornou algo mesmo!
        if(account && account.length > 0){
            res.statusCode = 200;
            res.send(`Acesso Liberado.\nBem Vindo`);
        }else{
            // Esse 401 é de não autorizado
            res.statusCode = 401;
            res.send(`Nome ou Senha Incorretos!`);
        }
      
    }
}