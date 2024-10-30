import { betsManager } from "../bets/bets";
import { EventsManager } from "../events/events"; 
import { DataBaseManager } from "./connection";
import OracleDB from "oracledb";


export namespace dbBetsManager
{
    export async function betting( bet: betsManager.newBet) 
    {    
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();
        try{
            await connection.execute(
                `INSERT INTO BETS
                (ID_BET, BET, VALUE_BET, ID_USER, ID_EVENT) 
                VALUES(SEQ_BETS.NEXTVAL, :userBet, :valuesBet, 
                :fk_ID_User, :fk_ID_Event)`,
                {   
                    userBet: bet.bet,
                    valuesBet: bet.valuesBet,
                    fk_ID_User: bet.fk_ID_User,
                    fk_ID_Event: bet.fk_ID_Event
                }
            );
            
            await connection.commit();

        }catch (error){
            console.log(`Erro: ${error}`);
            return false;
        }finally{
            await connection.close();
        }
        return true;
    }

    export async function searchForEvents() {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();
        
        const eventList: OracleDB.Result<EventsManager.Event> = await connection.execute(
            `SELECT * 
            FROM EVENT
            WHERE STATUS_EVENT = 'Ocorrendo'
            `
        );
        return eventList.rows;
    }
    
}