import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { FundsManager } from "../funds/funds";
import { AccountsManager } from "../accounts/accounts";
import { EventsManager } from "../events/events";

export namespace DataBaseManager
{
    
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
            INSERT INTO HISTORIC(
            TRANSACTION_ID,
            TRANSACTION_TYPE,
            TRANSACTION_VALUE,
            FK_ID_WALLET
            )values(
            SEQ_TRANSACTION.NEXTVAL,
            'SACAR',
            :-qtdSacar,
            :idWallet
            )`,
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
        await connection.commit();
        await connection.close();
    }

    export async function getNewEvents()
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();

        const newEventsList: OracleDB.Result<Event> = 
            await connection.execute(
                `
                SELECT ID_EVENT, TITLE, DESCRIPTION, CATEGORIES 
                FROM EVENTS
                WHERE status_event = 0
                `
        );
        await connection.close();
        console.log("Eventos retornados:", newEventsList.rows);
        return newEventsList.rows;
    }
    

    export async function addNewFunds(newFund: FundsManager.Funds) {

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = await get_connection();
    
        let attempts = 3;
        let successful = false;
    
        while (attempts > 0) {
            try {
                await connection.execute(
                    `INSERT INTO HISTORIC 
                    (TRANSACION_ID, TRANSACTION_TYPE, TRANSACTION_VALUE, FK_ID_WALLET) 
                    VALUES
                    (
                        SEQ_TRANSACTION.NEXTVAL, 
                        :typeTransaction, :credit, :id_wallet
                    )`,
                    {
                        typeTransaction: newFund.typeTransaction,
                        credit: newFund.value,
                        id_wallet: newFund.idWallet
                    }
                    );
                successful = true;
                await connection.commit();
            } catch (error) {
                console.error('Erro ao salvar nova conta:', error);
                attempts--;
            } finally { //tratamento (executa sempre, dando erro ou não)
                await connection.close();
            }
        }
        return successful;
        
    }
}