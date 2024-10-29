import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import { dbEventsManager } from "../db/databaseEvent";
import OracleDB from "oracledb";

export namespace EventsManager
{

    export type Event = {
        idEvent: number|undefined,
        title: string,
        description: string,
        status_event: number,
        categories: string,
        register_date: string | undefined,
        bets_funds: number,
        finish_date: string
    }

    export const addNewEventHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        if(req.session.role === undefined){
            console.log(req.session.token);
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        
        const pTitle = req.get('Title');
        const pDescription = req.get('Description');
        const pCategories = req.get('Categories');
        const pFinishDate = req.get('finishDate');

        if(pTitle && pDescription && pCategories && pFinishDate)
        {
            const newEvent: Event = 
            {
                idEvent: undefined,
                title: pTitle,
                description: pDescription,
                status_event: 0,
                categories: pCategories,
                register_date: undefined,
                bets_funds: 0.00,
                finish_date: pFinishDate
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

    
        const pEventID = req.get('eventID');
        const pValidate = req.get('validate');

        if(pEventID && pValidate)
        {
            const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();
            
            await connection.execute(
                `
                UPDATE EVENTS
                SET status_event = 1
                WHERE ID_EVENT = :id_event
                `,
                { id_event: pEventID } 
            );

            await connection.commit();
            await connection.close();

            const updatedEventsList = 
            await DataBaseManager.getNewEvents();

            res.statusCode = 200;
            res.send(updatedEventsList);
        }

        const newEventsList = 
        await DataBaseManager.getNewEvents();

        if(newEventsList)
        {
            res.statusCode = 200;
            res.send(newEventsList);
        }else{
            res.statusCode = 404;
            res.send('Nenhum evento encontrado!');
            return;
        }
    }

    export const finishEventHandler: RequestHandler =
    async (req: Request, res: Response) => {
        // e distribuir os fundos dos apostadores proporcionalmente aos vencedores). 
        if(!req.session.token)
        {
            res.statusCode = 401;
            res.send("Usuário não está logado");
        }else if(req.session.role === 0){
            res.statusCode = 401;
            res.send("Rota permitida apenas para moderadores");
        }

        const pIdEvent = Number(req.get('eventId'));
        const pVerdictCode = Number(req.get('verdictCode'));
        // 1 para aconteceu 2 para não aconteceu

        if(pIdEvent && pVerdictCode){
            await dbEventsManager.finishEvent(pIdEvent, pVerdictCode);
            await dbEventsManager.shareEventFunds(pIdEvent, pVerdictCode);

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
        
        const pStringBusca = req.get('title_request')

        if(pStringBusca){
            try{
                
                const events = await dbEventsManager.searchEvent(pStringBusca);

                if(events){
                    res.statusCode = 404;
                    res.send('Evento não encontrado.');
                }else{
                    res.statusCode = 200;
                    res.send(events);
                }
                
            } catch (error){
                console.error('Erro no servidor ao encontrar eventos.', error);
            }
        }else{
            res.statusCode = 400;
            res.send('Erro inesperado ao realizar busca de eventos');
        }
        
            
    }
}