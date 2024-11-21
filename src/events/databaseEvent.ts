import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "../db/connection";
import { EventsManager } from "../events/events";
import { FundsManager } from "../funds/funds";
import { dbFundsManager } from "../funds/databaseFunds";

export namespace dbEventsManager
{
    
    export async function addNewEvent(newEvent:EventsManager.Event)
    {

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        await connection.execute(
            `
            INSERT INTO EVENTS
            (ID_EVENT, TITLE, DESCRIPTION, CATEGORIES, STATUS_EVENT, 
            REGISTER_DATE, BETS_FUNDS, FINISH_DATE, FK_ID_USER)
            VALUES
            (SEQ_EVENTS.NEXTVAL, :title, :description, :categories,
            :status_event, SYSDATE, :bets_funds, :finish_date, :fk_id_user)
            `,
            {
                title: newEvent.TITLE,
                description: newEvent.DESCRIPTION,
                categories: newEvent.CATEGORIES,
                status_event: newEvent.STATUS_EVENT,
                bets_funds: newEvent.BETS_FUNDS,
                finish_date: newEvent.FINISH_DATE,
                fk_id_user: newEvent.FK_ID_USER
            },
        );
                    
        await connection.commit();
        await connection.close();

    }

    // Função utilizado para devolver user criador do evento
    export async function getUserEmail(eventId : number ) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        const userEmail : OracleDB.Result<{EMAIL : string}> = 
        await connection.execute(
           `SELECT AC.EMAIL AS EMAIL
            FROM EVENTS EV
            JOIN ACCOUNTS AC ON EV.FK_ID_USER = AC.ID
            WHERE ID_EVENT = :eventId`,
            { eventId : eventId }
        );
        
        await connection.close();
        // Verifica se existe algum resultado
        return userEmail.rows?.[0]?.EMAIL || null;
    }
    
    export async function changeStatusEvent(newStatus:string, eventId : number) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        await connection.execute(
            `
            UPDATE EVENTS
            SET STATUS_EVENT = :newStatus 
            WHERE ID_EVENT = :idEvent
            `,
            { newStatus :newStatus, idEvent: eventId } 
        );

        await connection.commit();
        await connection.close();
    }

    export async function getEventById(id:number) {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = await DataBaseManager.get_connection();
        
        try{
            const returnEvent: OracleDB.Result<EventsManager.Event> =
            await connection.execute(
               `
               SELECT *
               FROM EVENTS
               WHERE ID_EVENT = :eventID
               `,
               { eventId : id }
           );
           return returnEvent.rows;
           
        }catch(error){
            console.error('Erro ao encontrar eventos.', error);
        }finally{
            await connection.close();
        }

        return;
    }
    
    export async function calculateBetsFunds(idEvent: number) 
    {
        let connection = await DataBaseManager.get_connection();
        const totalBetsFunds: OracleDB.Result<{ VALUE_BET: number }> =
        await connection.execute(
            `
            SELECT SUM(VALUE_BET) AS VALUE_BET
            FROM BETS
            WHERE ID_EVENT = :idEvent
            `, { idEvent }
        );
        await connection.close();
        return totalBetsFunds.rows?.[0]?.VALUE_BET || 0;
    }
    
    export async function shareEventFunds(idEvent: number, verdict: string) 
    {
        // Estabelece uma conexão com o banco de dados
        let connection = await DataBaseManager.get_connection();
    
        // Calcula o total de fundos apostados no evento
        const totalEventFunds = await calculateBetsFunds(idEvent);
    
        // Conta o número de apostadores que acertaram o resultado (ganhadores)
        const countWinners: OracleDB.Result<{TOTAL_BETTORS: number}> = 
        await connection.execute(
            `
            SELECT COUNT(ID_USER) AS TOTAL_BETTORS
            FROM BETS
            WHERE ID_EVENT = :idEvent AND BET = :verdict
            `, { idEvent, verdict }
        );
    
        // Obtém o número total de ganhadores
        const totalWinners = countWinners.rows?.[0]?.TOTAL_BETTORS || 0;
    
        // Se houver ganhadores
        if(totalWinners > 0){
            // Calcula o valor que cada ganhador receberá
            const winnersValue = totalEventFunds / totalWinners;
    
            // Recupera a lista dos IDs dos ganhadores
            const idWinnersList: OracleDB.Result<{ID_USER: number}> =
            await connection.execute(
                `SELECT ID_USER
                FROM BETS
                WHERE ID_EVENT = :idEvent AND BET = :verdict
                `, { idEvent, verdict }
            );
            // Perguntar sobre batch processing para o mateues
            // Se houver ganhadores na lista, processa cada um deles
            if(idWinnersList.rows){
                for(const winner of idWinnersList.rows || []) 
                {
                    // Obtém o ID do usuário ganhador
                    const idUser = winner.ID_USER;
    
                    // Recupera o ID da carteira do usuário
                    const idWallet = await DataBaseManager.getIdWallet(idUser);
                    
                    // Se o ID da carteira for encontrado, atualiza o saldo
                    if(idWallet){
                        await connection.execute(
                            `UPDATE WALLETS
                            SET BALANCE = (BALANCE + :winnersValue)
                            WHERE FK_ID_USER = :fk_id_user`,
                            { winnersValue: winnersValue, fk_id_user: idUser }
                        );
            
                        // Cria um novo registro no histórico de transações
                        const newTransaction: FundsManager.Historic = {
                            fkIdWallet: Number(idWallet[0].ID_WALLET),
                            typeTransaction: 'Ganho',  // Indica o tipo de transação como "Ganho"
                            value: winnersValue  // Valor recebido pelo ganhador
                        };
                        await dbFundsManager.addLineHistoric(newTransaction);  // Adiciona a linha ao histórico
                    }
                }
                await connection.commit();  // Confirma as transações
            }
            // Fecha a conexão com o banco de dados após a distribuição dos fundos
            await connection.close();
        }
    }
    
    // Finalizar apenas eventos em um dia posterior a data de termino
    export async function finishEvent(pIdEvent: number, verdict: string)
    {
        let connection = await DataBaseManager.get_connection();
        const EventFunds = await calculateBetsFunds(pIdEvent);

        await connection.execute(
           `UPDATE EVENTS
            SET RESULT_EVENT = :verdict,
                STATUS_EVENT = 'Finalizado',
                BETS_FUNDS = :totalEventFunds
            WHERE ID_EVENT = :idEvent`, 
            { 
                verdict: verdict, 
                idEvent: pIdEvent, 
                totalEventFunds : EventFunds 
            }
        );

        await connection.commit();
        await connection.close();
    }
    
    export async function searchEvent(stringBusca: string)
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
    
    export async function getNewEvents()
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();

        const newEventsList: OracleDB.Result<Event> = 
            await connection.execute(
                `
                SELECT ID_EVENT, TITLE, DESCRIPTION, CATEGORIES, STATUS_EVENT 
                FROM EVENTS
                WHERE STATUS_EVENT = 'Pendente'
                `
        );
        await connection.close();
        console.log("Eventos retornados:", newEventsList.rows);
        return newEventsList.rows;
    }

    export async function deleteEvent(pEventID: number)
    {
        let connection = await DataBaseManager.get_connection();
        
        try{
            await connection.execute(
                `UPDATE EVENTS
                SET STATUS_EVENT = 'Deletado'
                WHERE ID_EVENT = :idEvent`, 
                { idEvent : pEventID }
            );

            await connection.commit();

        }catch(error){
            console.error('Erro ao deletar evento.', error);
        }finally{
            await connection.close();
        }
    }

    export async function verifyPropertyEvent(token:string, idEvent: number) 
    {
        let connection = await DataBaseManager.get_connection();

        const id_user = await DataBaseManager.getUserID(token);

        const searchForEventOwner: OracleDB.Result<{FK_ID_USER: number}> =
        await connection.execute(
            `SELECT FK_ID_USER
            FROM EVENTS
            WHERE ID_EVENT = :id_event`,
            { id_event: idEvent }
        );

        await connection.close();
        const eventOwner = searchForEventOwner.rows?.[0].FK_ID_USER
        if(eventOwner === id_user)
            return true;

        return false;
    }

    export async function isPending(idEvent: number)
    {
        let connection = await DataBaseManager.get_connection();

        
        const status: OracleDB.Result<{STATUS_EVENT: string}> =
        await connection.execute(
            `SELECT STATUS_EVENT
            FROM EVENTS
            WHERE ID_EVENT = :id_event`,
            { id_event: idEvent }
        );

        await connection.close();
        const result = status.rows?.[0].STATUS_EVENT;
        if(result === 'Pendente')
            return true;

        return false;
    }
}



