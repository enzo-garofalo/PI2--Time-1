import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { FundsManager } from "../funds/funds";
import { AccountsManager } from "../accounts/accounts";

export namespace DataBaseManager{
    
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

    export async function getUserID(token:string)
    {
        const connection = await get_connection()
        
        const userID : OracleDB.Result<number>  = 
            await connection.execute(
                `SELECT ID FROM ACCOUNTS
                WHERE TOKEN = :token`,
                {token}
        );

        return userID.rows;
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

    export async function saveNewAccount(account:AccountsManager.userAccount) 
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection:OracleDB.Connection = 
              await get_connection();

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

    export async function getSaldoAtual(idWallet: number) 
    {
        //verificar saldo atual
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        const result: OracleDB.Result<{BALANCE: number}> = 
        await connection.execute(
            'SELECT BALANCE FROM WALLET WHERE ID = :idWallet',
            {idWallet}
        ); 

        await connection.close();
        return result.rows;
    }

    export async function newfoundWithdraw(qtdSacar: number, idWallet:number) 
    {
        
        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        await connection.execute(
            `
            UPDATE WALLET 
            SET BALANCE = BALANCE - qtdSacar 
            WHERE ID = idWallet
            `,
            {qtdSacar, idWallet}
        );

        await connection.commit();
        await connection.close();
    }

    export async function getBalanceById(id_wallet : number)
    {
        const connection:OracleDB.Connection = await get_connection();

        const balance : OracleDB.Result<{BALANCE: number}>  = 
            await connection.execute(
                `
                SELECT SUM(TRANSACTION_VALUE) 
                FROM HISTORIC 
                WHERE FK_ID_WALLET = :id_wallet
                `,
                {id_wallet}
        );

        await connection.close;
        return balance.rows;
    }

    export async function refreshBalance(id_wallet:number) 
    {
        const connection:OracleDB.Connection = await get_connection();
        const balance = await getBalanceById(id_wallet);
        
        if(balance){
            await connection.execute(
                `
                UPDATE WALLET
                SET BALANCE = :balance
                WHERE ID_WALLET = :id_wallet
                `,
                {
                    balance: balance[0].BALANCE, 
                    id_wallet: id_wallet
                }
            );
        }
        

        await connection.commit
        
    }
}