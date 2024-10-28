import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "./connection";
import { EventsManager } from "../events/events";

export namespace dbEventsManager
{
    async function calculateBetsFunds(idEvent: number) 
    {
        let connection = await DataBaseManager.get_connection();
        const totalBetsFunds: OracleDB.Result<{VALUE_BET: number}> = 
        await connection.execute(
            `
            SELECT SUM(VALUE_BET)
            FROM BETS
            WHERE ID_EVENT
            `, { idEvent }
        );
        await connection.close();
        if(totalBetsFunds.rows)
            return totalBetsFunds.rows[0].VALUE_BET;
    }

    export async function shareEventFunds(idEvent:number, verdictCode:number)
    {
        let connection = await DataBaseManager.get_connection();

        const totalEventFunds = Number(calculateBetsFunds(idEvent));

        const countWinners: OracleDB.Result<{TOTAL_BETTORS : number}> = 
        await connection.execute(
            `
            SELECT COUNT(ID_USER)
            FROM BETS
            WHERE ID_EVENT = :idEvent AND BET = :verdictBet
            `, { idEvent, verdictCode }
        );

        var winnersValue = null;
        if(countWinners.rows){
            //Cálculo do ganhado por cada winner
            const totalWinners = countWinners.rows[0].TOTAL_BETTORS;
            winnersValue = totalEventFunds/totalWinners;

            // lista do id de ganhadores para fazer transações
            const idWinnersList: OracleDB.Result<{ID_USER: number}> =
            await connection.execute(
                `SELECT ID_USER
                FROM BETS
                WHERE ID_EVENT = :idEvent AND BET = :verdictBet
                `, { idEvent, verdictCode }
            );

            if(idWinnersList.rows){
                for(const winner of idWinnersList.rows){
                    const idUser = winner.ID_USER;

                }
            }
        }
        
    }

    export async function finishEvent(idEvent: number, verdictCode: number)
    {
        let connection = await DataBaseManager.get_connection();
        const EventFunds = calculateBetsFunds(idEvent);

        await connection.execute(
           `UPDATE EVENTS
            SET RESULT_EVENT = :verdictCode,
            STATUS_EVENT = 2,
            BETS_FUNDS = :totalEventFunds
            WHERE ID_EVENT = :idEvent`, 
            { 
                verdictCode: verdictCode, 
                idEvent: idEvent, 
                totalEventFunds : Number(EventFunds) 
            }
        );

        await connection.commit();
        await connection.close();
    }
    
    export async function getEvent(stringBusca: string)
    {
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = await DataBaseManager.get_connection();

        try{
            const returnEvent: OracleDB.Result<{Event: string}> =
            await connection.execute(
               `
               SELECT *
               FROM EVENTS
               WHERE TITLE = :stringBusca
               `,
               {stringBusca}
           );
           return returnEvent.rows;
           
        }catch(error){
            console.error('Erro ao encontrar eventos.', error);
        }finally{
            await connection.close();
        }
            
    }
    
}



