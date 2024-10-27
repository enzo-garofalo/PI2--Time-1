import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";


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
    //conexão com  o BD
    async function saveNewAccount(account:userAccount) {
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
              await DataBaseManager.get_connection();

        let attempts = 3;
        let sucessfull = false;

        while(attempts > 0)
        {
            try
            {
                await connection.execute(
                    `INSERT INTO ACCOUNTS 
                    (ID, COMPLETE_NAME, EMAIL, PASSWORD, BIRTHDATE, ROLE, TOKEN) 
                    VALUES
                    (
                        SEQ_ACCOUNTS.NEXTVAL, 
                        :name, :email, :password, :birthdate, :role, 
                        DBMS_RANDOM.STRING('X', 32)
                    )`,
                    {   name: account.NAME,
                        email: account.EMAIL,
                        password: account.PASSWORD,
                        birthdate: account.BIRTHDATE,
                        role: account.ROLE }
                );
                console.log('Nova conta adicionada');
                sucessfull = true;
                break;
            }catch(error){
                console.error(error);
                attempts--;
            }
        }
        await connection.commit();
        await connection.close();
    
        return sucessfull;
    }

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
            // Precisei colocar um await aqui
            if(await saveNewAccount(newAccount))
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
        // Fiz a função retornar as linhas que encontrou
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
            
            if(account){
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