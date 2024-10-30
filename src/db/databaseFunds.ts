import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "./connection";
import { FundsManager } from "../funds/funds";

export namespace dbFundsManager
{
    export async function addNewFunds(newFund: FundsManager.Funds) {

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();

        try{
            await connection.execute(
                `INSERT INTO HISTORIC 
                (TRANSACTION_ID, TRANSACTION_TYPE, TRANSACTION_VALUE, FK_ID_WALLET) 
                VALUES
                (
                    SEQ_TRANSACTION.NEXTVAL, 
                    :typeTransaction, :credit, :id_wallet
                )`,
                {
                    typeTransaction: { val: newFund.typeTransaction, type: OracleDB.STRING },
                    credit: { val: newFund.value, type: OracleDB.NUMBER },
                    id_wallet: { val: newFund.idWallet, type: OracleDB.NUMBER }
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