import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "../db/connection";
import { FundsManager } from "../funds/funds";

export namespace dbFundsManager
{

    /*Função que adiciona linhas no histórico*/
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

    /*Altera o valor do Balance de acordo com o valor passado*/
    export async function upDateBalance(updateWallet: FundsManager.Wallet, Value: number) {

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
                    balance: updateWallet.balance + Value,
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