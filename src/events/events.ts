import {Request, RequestHandler, Response} from "express";
import { dbEventsManager } from "../db/databaseEvent";
import { DataBaseManager } from "../db/connection";
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

    //função que coloca o evento no BD (medina)

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

    async function getNewEvents()
    {
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();

        const newEventsList: OracleDB.Result<Event> = 
            await connection.execute(
                `
                SELECT ID_EVENT, TITLE, DESCRIPTION, CATEGORIES 
                FROM EVENTS
                WHERE ISVALID = 0
                `
        );
        await connection.close();
        console.log("Eventos retornados:", newEventsList.rows);
        return newEventsList.rows;
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
        const pValidate = req.get('validate');

        if(pEventID && pValidate)
        {
            const connection:OracleDB.Connection = 
                await DataBaseManager.get_connection();
            
            await connection.execute(
                `
                UPDATE EVENTS
                SET ISVALID = 1
                WHERE ID_EVENT = :id_event
                `,
                { id_event: pEventID } 
            );

            await connection.commit();
            await connection.close();

            const updatedEventsList = await getNewEvents();
            res.statusCode = 200;
            res.send(updatedEventsList);
        }
        const newEventsList = await getNewEvents();

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

    export const deleteEventHandler: RequestHandler = 
     async (req: Request, res: Response) => {

            const pEventID = req.get('id_event');

            if (!pEventID){
                res.statusCode = 400;
                res.send("Formato de requisição inválido");
                return;
            }

            const connection: OracleDB.Connection = 
                await DataBaseManager.get_connection();


            try {
                const eventCheck = await connection.execute(
                    `SELECT ISVALID, (SELECT COUNT(*) 
                    FROM BETS WHERE fk_ID_Event = :id_event) AS HAS_BETS 
                    FROM EVENTS 
                    WHERE ID_EVENT = :id_event`,
                    {id_event: pEventID}
                );

                const eventRow = eventCheck.rows?.[0] as 
                {ISVALID: number, HAS_BETS: number}

                if (!eventRow){
                    res.statusCode = 404;
                    res.send("Evento não encontrado.");
                    return;
                }

                if (eventRow.ISVALID == 1){
                    res.statusCode = 406;
                    res.send("Requisição não aceitável. Evento se encontra ativo.")
                    return;
                }

                if (eventRow.ISVALID == 2){
                    res.statusCode = 406;
                    res.send("Requisição não aceitável. Evento se encontra encerrado.")
                    return;
                }
                
                if (eventRow.ISVALID == 3){
                    res.statusCode = 406;
                    res.send("Requisição não aceitável. Evento foi negado.")
                    return;
                }

                if (eventRow.HAS_BETS > 0){
                    res.statusCode = 406;
                    res.send("Requisição não aceitável. Evento possui apostas ativas.")
                    return;
                }

                await connection.execute(
                    `UPDATE EVENTS
                    SET ISVALID = 4
                    WHERE ID_EVENT = :id_event`,
                    {id_event: pEventID}
                );

                await connection.commit();
                res.statusCode = 200;
                res.send("Evento removido com sucesso.");
        }
        catch(error){
            console.error("Erro ao deletar evento", error);
            res.statusCode = 500;
            res.send("Erro ao processar a requisição");
        }finally{
            await connection.close();
        }   
    }        
}
