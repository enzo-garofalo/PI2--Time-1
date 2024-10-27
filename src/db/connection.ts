import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { AccountsManager } from "../accounts/accounts";

export namespace DataBaseManager{
    
    export async function get_connection(){
        let connection: OracleDB.Connection;
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT

        connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        return connection;
    }

    export async function getUserID(connection:OracleDB.Connection, token:string)
    {
        const userID : OracleDB.Result<number>  = 
            await connection.execute(
                `SELECT ID FROM ACCOUNTS
                WHERE TOKEN = :token`,
                {token}
        );
        return userID;
    }

    export async function getUserByToken(token: string)
    {
        const connection = await get_connection()

        const account: OracleDB.Result<AccountsManager.userAccount> =
        await connection.execute(
            `
            SELECT * FROM ACCOUNTS
            WHERE TOKEN = :token
            `, 
            { token } 
        );

        await connection.close();
        return account.rows;
    }
}