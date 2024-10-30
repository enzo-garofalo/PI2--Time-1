import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "./connection";
import { FundsManager } from "../funds/funds";

export namespace dbFundsManager
{
    export async function addLineHistoric(newFund: FundsManager.Historic) {

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();

        try{
            await connection.execute(
                `
                INSERT INTO HISTORIC 
                (TRANSACTION_ID, TRANSACTION_TYPE, TRANSACTION_VALUE, FK_ID_WALLET) 
                VALUES (SEQ_TRANSACTION.NEXTVAL, :typeTransaction, :value, :id_wallet )
                `,
                {
                    typeTransaction: newFund.typeTransaction,
                    value: newFund.value,
                    id_wallet: newFund.fkIdWallet
                }
            );
            
            await connection.commit();
        }catch{
            console.log('erro inesperado');
            return false;
        }finally{
            await connection.close();
            return true;
        }
    }

    export async function upDateBalance(updateWallet: FundsManager.Wallet, Credit: number) {

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();

        try{
            await connection.execute(
                `
                UPDATE WALLETS
                SET BALANCE = :balance
                WHERE ID_WALLET = :idwallet
                `,
                {
                    balance: updateWallet.balance + Credit,
                    idwallet: updateWallet.idWallet
                }
            
            );
            await connection.commit();
        }catch{
            console.log('erro inesperado');
            return false;
        }finally{
            await connection.close();
            return true;
        }
    }
}