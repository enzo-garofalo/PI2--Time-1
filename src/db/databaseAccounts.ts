import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { FundsManager } from "../funds/funds";
import { AccountsManager } from "../accounts/accounts";
import { DataBaseManager } from "./connection";

export namespace dbAccountsManager
{

    /*Função que salva nova conta do BD*/
    export async function saveNewAccount
    (account: AccountsManager.userAccount, newAccountWallet: FundsManager.Wallet) 
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();
    
        let attempts = 3;
        let successful = false;
    
        while (attempts > 0) {
            try {
                await connection.execute(
                    `INSERT INTO ACCOUNTS 
                    (ID, COMPLETE_NAME, EMAIL, PASSWORD, BIRTHDATE, ROLE, TOKEN) 
                    VALUES
                    (
                        SEQ_ACCOUNTS.NEXTVAL, 
                        :name, :email, :password, :birthdate, :role, 
                        DBMS_RANDOM.STRING('X', 32)
                    )`,
                    {
                        name: account.NAME,
                        email: account.EMAIL,
                        password: account.PASSWORD,
                        birthdate: account.BIRTHDATE,
                        role: account.ROLE
                    }
                );
                
                /*Sempre fazer commit após alterações no BD*/
                await connection.commit();
    
                const resultadoID: OracleDB.Result<{ ID: Number }> = 
                await connection.execute(
                    `SELECT ID 
                    FROM ACCOUNTS
                    WHERE EMAIL = :email AND PASSWORD = :password`,
                    { email: account.EMAIL, password: account.PASSWORD }
                );
    
                if (resultadoID.rows && resultadoID.rows.length > 0) {
                    const idUsuario = resultadoID.rows[0].ID;
    
                    await connection.execute(
                        `INSERT INTO WALLETS
                        (ID_WALLET, BALANCE, FK_ID_USER)
                        VALUES
                        (
                            SEQ_WALLETS.NEXTVAL,
                            :BALANCE, :FK_ID_USER
                        )`,
                        {
                            BALANCE: Number(newAccountWallet.balance),
                            FK_ID_USER: Number(idUsuario)
                        }
                    );
                    
                    await connection.commit();
                    console.log('Nova conta adicionada');
                    successful = true;
                    break;
                }
            } catch (error) {
                console.error('Erro ao salvar nova conta:', error);
                attempts--;
            } finally { //tratamento (executa sempre, dando erro ou não)
                await connection.close();
            }
        }
        return successful;
    }

    /*Faz o login do usuário no sistema se receber email e senha cadastrados*/
    export async function login(email:string, password: string) 
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        const result: OracleDB.Result<{ TOKEN: string }> = 
        await connection.execute(
            `
            SELECT TOKEN 
            FROM ACCOUNTS 
            WHERE EMAIL = :email AND PASSWORD = :password
            `, {email, password}
        );

        await connection.close();
        return result.rows;
    }
}