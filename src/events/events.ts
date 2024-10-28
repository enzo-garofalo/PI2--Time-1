import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";


export namespace EventsManager{

    export type Event = {
        idEvent: number|undefined,
        title: string,
        description: string,
        isValid: number,
        categories: string
    }

    //função que coloca o evento no BD (medina)
    async function addNewEvent(event:Event){

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();
        
        let attempts = 3;
        let sucessfull = false;

        while(attempts > 0){
            try {
                await connection.execute(
                    `INSERT INTO EVENTS
                    (ID_EVENT, TITLE, DESCRIPTION, CATEGORIES, ISVALID)
                    VALUES
                    (
                    SEQ_EVENTS.NEXTVAL,
                    :title, :description, :categories, :isValid
                    )`,
                    {
                        title: event.title,
                        description: event.description,
                        categories: event.categories,
                        isValid: event.isValid
                    }
                );
                
                
            console.log('Novo Evento criado. Pendente aprovação.')
            sucessfull = true;
            break;
            }catch(error){
                console.error(error);
                attempts--;
            }
        }
        await connection.commit();
        await connection.close();

        return sucessfull;
    }

    export const addNewEventHandler: RequestHandler = 
        async (req: Request, res: Response) => {

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
                isValid: 0,
                categories: pCategories
            }

            if (await addNewEvent(newEvent))
            {
                req.statusCode = 200;
                res.send("Novo Evento adicionado.");
            }else{
                res.statusCode = 409;
                res.send("Erro inesperado ao criar o evento");
            }
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


    
}