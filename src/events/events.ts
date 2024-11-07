import {Request, RequestHandler, Response} from "express";
import { dbEventsManager } from "./databaseEvent";
import { DataBaseManager } from "../db/connection";

import { emailSenderManager } from "./emailSender";
import OracleDB from "oracledb";


export namespace EventsManager
{
    
    export type Event = {
        ID_EVENT: number|undefined,
        TITLE: string,
        DESCRIPTION : string,
        CATEGORIES: string,
        STATUS_EVENT: string,
        RESULT_EVENT: string | undefined,
        REGISTER_DATE: string | undefined,
        BETS_FUNDS: number,
        FINISH_DATE: string,
        FK_ID_USER: number | undefined
    }


    export const addNewEventHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        if(req.session.token === undefined){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        
        const pTitle = req.get('Title');
        const pDescription = req.get('Description');
        const pCategories = req.get('Categories');
        const pFinishDate = req.get('finishDate');

        const id_user  = 
        await DataBaseManager.getUserID(req.session.token);

        if(pTitle && pDescription && pCategories && pFinishDate && id_user)
        {

            const newEvent: Event = 
            {
                ID_EVENT: undefined,
                TITLE: pTitle,
                DESCRIPTION : pDescription,
                CATEGORIES: pCategories,
                STATUS_EVENT: 'Pendente',
                RESULT_EVENT: undefined,
                REGISTER_DATE: undefined,
                BETS_FUNDS: 0.00,
                FINISH_DATE: pFinishDate,
                FK_ID_USER: id_user
            }
            await dbEventsManager.addNewEvent(newEvent);
            req.statusCode = 200;
            res.send("Novo Evento adicionado.");
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }

    export const evaluateNewEventHandler: RequestHandler =
    async (req : Request, res : Response) => {
    
        if(req.session.role === 0 || !req.session.role){
            res.statusCode = 401;
            res.send('Rota autorizada apenas para moderadores');
            return;
        }

        console.log(req.session.role);
        const pEventID = req.get('eventID');
        // 1 para é aprovado, 0 para não aprovado
        const pIsValid = req.get('isValid');

        if(pEventID && pIsValid)
        {
            const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();
            
            var newStatus = '';

            if(Number(pIsValid) === 1){
                newStatus = 'Aprovado';
            }else if(Number(pIsValid) === 0){
                await emailSenderManager.sendMail();
                newStatus = 'Reprovado';
            }else{
                res.statusCode = 400;
                res.send('Formato de requisição inválido!');
                await connection.close();
                return;
            }

            await connection.execute(
                `
                UPDATE EVENTS
                SET STATUS_EVENT = :newStatus 
                WHERE ID_EVENT = :idEvent
                `,
                { newStatus :newStatus, idEvent: pEventID } 
            );

            await connection.commit();
            await connection.close();

            const updatedEventsList = await dbEventsManager.getNewEvents();
            if(updatedEventsList?.length === 0)
            {
                res.statusCode = 200;
                res.send('Não há eventos pendentes!');
            }else{
                res.statusCode = 200;
                res.send(updatedEventsList);
            }
            return;
        }
        const newEventsList = await dbEventsManager.getNewEvents();

        if(newEventsList)
        {
            if(newEventsList.length === 0){
                res.statusCode = 200;
                res.send('Não há eventos pendentes!');
            }else{
                res.statusCode = 200;
                res.send(newEventsList);
            }
        }else{
            res.statusCode = 404;
            res.send('Nenhum evento encontrado!');
            return;
        }
    }   

    export const finishEventHandler: RequestHandler =
    async (req: Request, res: Response) => {
        if(!req.session.token)
        {
            res.statusCode = 401;
            res.send("Usuário não está logado");
        }else if(req.session.role === 0){
            res.statusCode = 401;
            res.send("Rota permitida apenas para moderadores");
        }

        const pIdEvent = Number(req.get('eventId'));
        const pVerdict = req.get('aconteceu');
        // 1 para aconteceu 0 para não aconteceu

        if(pIdEvent && pVerdict){
            await dbEventsManager.finishEvent(pIdEvent, pVerdict);
            await dbEventsManager.shareEventFunds(pIdEvent, pVerdict);

            res.statusCode = 200;
            res.send('Evento finalizado e ganhos distribuídos!');
        }else{
            res.statusCode = 400;
            res.send("Formato de requisição inválido.");
        }        
    };    

    export const searchEventHandler: RequestHandler =
    async (req: Request, res: Response) => {

        if(!req.session.role){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        
        const pStringBusca = req.get('stringBusca')

        if(pStringBusca){
            try{
                
                const events = await dbEventsManager.searchEvent(pStringBusca);

                if(events && events.length > 0){
                    res.statusCode = 200;
                    res.send(events);
                }else{
                    res.statusCode = 404;
                    res.send('Evento não encontrado.');
                }
                
            } catch (error){
                console.error('Erro no servidor ao encontrar eventos.', error);
            }
        }else{
            res.statusCode = 400;
            res.send('Erro inesperado ao realizar busca de eventos');
        }   
    }

    export const deleteEventHandler: RequestHandler = 
     async (req: Request, res: Response) => {
        
        // Verifica se user está logado
        if(!req.session.token){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }

        const pEventID = Number(req.get('id_event'));
        const userToken = req.session.token;
        
        // Verifica se o user é dono do evento a ser modificado
        const isOwner: boolean = 
        await dbEventsManager.verifyPropertyEvent(userToken, pEventID);

        if(pEventID && isOwner)
        {
            //Verifica se há apostas no evento
            const EventFunds = 
            await dbEventsManager.calculateBetsFunds(pEventID);
            
            // Verifica se o evento é está no status 'Pendente',
            // Não deve ser possível deletar em outro status
            const isPending: boolean = await dbEventsManager.isPending(pEventID)
            if( EventFunds > 0 || isPending === false ){
                res.statusCode = 200;
                res.send('Não é possível deletar o evento! \
                        \nHá apostas no evento ou ele está aberto!');
                return;
            }

            await dbEventsManager.deleteEvent(pEventID);

            res.statusCode = 200;
            res.send('Evento deletado com sucesso!');
            
        }else if(!isOwner){
            res.statusCode = 401;
            res.send("Usuário não é proprietário do evento!");
        }else{
            res.statusCode = 404;
            res.send('Formato de requisição inválido!')
        }
        
        return;
    }        

    export const getEventHandler: RequestHandler = 
    async (req: Request, res: Response) => {
        
        if (req.session.role === undefined) {
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }

        const pStatus = req.get('status');
        let consulta = '';

        const connection: OracleDB.Connection = await DataBaseManager.get_connection();

        try {
            switch (pStatus) {
                case "pendente":
                    consulta = `SELECT ID_EVENT, TITLE, DESCRIPTION, CATEGORIES,
                                REGISTER_DATE, FINISH_DATE
                                FROM EVENTS
                                WHERE STATUS_EVENT = 'Pendente'`;
                    break;

                case "finalizado":
                    consulta = `SELECT ID_EVENT, DESCRIPTION, CATEGORIES,
                                REGISTER_DATE, FINISH_DATE
                                FROM EVENTS
                                WHERE STATUS_EVENT = 'Finalizado'`;
                    break;

                case "aprovado":
                    consulta = `SELECT ID_EVENT, DESCRIPTION, CATEGORIES,
                                REGISTER_DATE, FINISH_DATE
                                FROM EVENTS
                                WHERE STATUS_EVENT = 'Aprovado'`;
                    break;

                case "deletado":
                    consulta = `SELECT ID_EVENT, DESCRIPTION, CATEGORIES,
                                REGISTER_DATE, FINISH_DATE
                                FROM EVENTS
                                WHERE STATUS_EVENT = 'Deletado'`;
                    break;

                default:
                    res.statusCode = 400;
                    res.send("Status inválido. Tente usar 'pendente', 'finalizado', 'aprovado' ou 'deletado'.");
                    return;
            }

            const result: OracleDB.Result<Event> = await connection.execute(consulta);
            if(result.rows?.length === 0){
                res.statusCode = 200;
                res.send(`Não há eventos do status: ${pStatus}`);
            }else{
                res.statusCode = 200;
                res.send(result.rows);
            }
        } catch (error){
            console.error("Erro ao obter eventos:", error);
            res.statusCode = 500;
            res.send("Erro ao processar a requisição");

        } finally{
            await connection.close();
            return;
        }
    }
}
