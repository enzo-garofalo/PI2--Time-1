import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";
import { title } from "process";
import { subscribe } from "diagnostics_channel";

export namespace EventsManager{

    export type Event = {
        idEvent: number|undefined,
        title: string,
        description: string,
        //eventDate:string
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
                    (ID_EVENT, TITLE, DESCRIPTION, CATEGORIES)
                    VALUES
                    (
                    SEQ_EVENTS.NEXTVAL,
                    :TITLE, :DESCRIPTION, :CATEGORIES
                    )`,
                    {
                        title: event.title,
                        description: event.description,
                        categories: event.categories}
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
    async (req: Request, res: Response) =>
    {
        const pTitle = req.get('Title');
        const pDescription = req.get('Description');
        const pCategories = req.get('Categories');

        if(pTitle && pDescription && pCategories){
            const newEvent: Event = {
                idEvent: undefined,
                title: pTitle,
                description: pDescription,
                categories: pCategories
            }
            if (await addNewEvent(newEvent)){
                req.statusCode = 200;
                res.send("Novo Evento adicionado.");
            }else{
                res.statusCode = 409;
                res.send("Erro inesperado ao criar o evento")
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    }
}









    /*
    function printEvent(event:Event){
        return(`
            ==================================
            Id do evento: ${event.id}.
            Titulo: ${event.title}
            Descrição: ${event.description}
            Data do evento: ${event.eventDate}
            ==================================
        `);
    }
    // Talvez será necessário fazer duas tabelas
    export const NewEventHandler:RequestHandler = (req:Request, res:Response) => {
        const pTitle = req.get('title');
        const pDescription = req.get('description');
        // Adicionar verificação de data!
        const pEventDate = req.get('eventDate');
        
        if(pTitle && pDescription && pEventDate){
            const newEvent: Event = {
                id: (EventsDatabase.length+1),
                title: pTitle,
                description: pDescription,
                eventDate:pEventDate
            };
            const id = addNewEvent(newEvent);
            res.status(200);
            res.send(printEvent(newEvent));
        }else{
            res.statusCode = 400;
            res.send(`Não foi Possível criar novo Evento\nParâmetros Faltantes!`)
        }
    }
    
    export const GetEventHandler:RequestHandler = (req:Request, res:Response) => {
        if(EventsDatabase.length == 0){ 
            res.status(400).send('Não há eventos cadastrados');
        }else{
            res.status(200).send(EventsDatabase);
        }
    }
}
*/    