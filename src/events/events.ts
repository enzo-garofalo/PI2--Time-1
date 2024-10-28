import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";

export namespace EventsManager
{

    export type Event = {
        idEvent: number|undefined,
        title: string,
        description: string,
        status_event: number,
        categories: string
    }

    export const addNewEventHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        if(req.session.role){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        
        const pTitle = req.get('Title');
        const pDescription = req.get('Description');
        const pCategories = req.get('Categories');

        if(pTitle && pDescription && pCategories)
        {
            const newEvent: Event = 
            {
                idEvent: undefined,
                title: pTitle,
                description: pDescription,
                status_event: 0,
                categories: pCategories
            }
                await DataBaseManager.addNewEvent(newEvent);
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
        // Serviço usado para encerrar o evento, 
        // informando um veredito se ocorreu ou não, 
        // e distribuir os fundos dos apostadores proporcionalmente aos vencedores). 
        if(!req.session.token)
        {
            res.statusCode = 401;
            res.send("Usuário não está logado");
        }else if(req.session.role === 0){
            res.statusCode = 401;
            res.send("Rota permitida apenas para moderadores");
        }

        const pIdEvent = req.get('eventId');
        const pVerdictCode = req.get('verdictCode');
        // 1 para aconteceu 2 para não aconteceu

        if(pIdEvent && pVerdictCode){
            
        }else{
            
        }

        
    }
;    export async function getEvent(event: EventsManager.Event, stringBusca: string){
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        const connection: OracleDB.Connection = await DataBaseManager.get_connection();

        const returnEvent: OracleDB.Result<{Event: string}> =
         await connection.execute(
            `
            SELECT TITLE
            FROM EVENTS
            WHERE TITLE = :stringBusca
            `,
            {stringBusca}
        );
            await connection.commit();
            await connection.close();
    }

    export const getEventHandler: RequestHandler =
    async (req: Request, res: Response) => {

        if(req.session.role){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        

        
    }



}