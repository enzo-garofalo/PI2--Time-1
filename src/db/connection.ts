import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 
import { AccountsManager } from "../accounts/accounts";


export namespace DataBaseManager
{

    /*Faz a conexão com o BD com as credenciais*/
    export async function get_connection()
    {
        let connection: OracleDB.Connection;
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT

        connection = await OracleDB.getConnection
        ({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        return connection;
    }

    /*Retorna o ID do usuário pelo token do usuário*/
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

    export async function getUserID(token: string) {
        const connection = await get_connection();
    
        const userID: OracleDB.Result<{ ID: number }> = await connection.execute(
            `SELECT ID FROM ACCOUNTS WHERE TOKEN = :token`,
            { token }
        );
    
        await connection.close();
    
        return userID.rows ? userID.rows[0]?.ID : undefined; // Retorna o ID diretamente ou undefined
    }
    
    /*Retorna o ID da Wallet pelo ID do usuário*/
    export async function getIdWallet(id_user:number) 
    {
        
        const connection:OracleDB.Connection = await get_connection();

        const idWallet : OracleDB.Result<{ID_WALLET : number}>  = 
            await connection.execute(
                'SELECT ID_WALLET FROM WALLETS WHERE FK_ID_USER = :id_user',
                {id_user}
        );
        return idWallet.rows;

    }

    /*Faz Join nas tabelas de Usuários e carteiras e retorna ID do Usuário e Carteira
     e o balanço da carteira recebendo o Token*/
    export async function joinTables(token:string) {

        const connection = await DataBaseManager.get_connection()
        
        const userID : OracleDB.Result<{IDUSER: number, IDWALLET: number, BALANCE: number}> = 
            await connection.execute(
                `SELECT AC.ID AS IDUSER, WL.ID_WALLET AS IDWALLET, WL.BALANCE AS BALANCE
                FROM ACCOUNTS AC
                JOIN WALLETS WL ON AC.ID = WL.FK_ID_USER
                WHERE AC.TOKEN = :token`,
                {token}
        );

        return userID.rows;
    }
}