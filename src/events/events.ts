import { Request, Response, RequestHandler } from "express";

export namespace EventsManager{

    export type Event = {
        id:number,
        title:string,
        description:string,
        eventDate:string
    }

    export let EventsDatabase:Event [] = [];

    function addNewEvent(event:Event){
        EventsDatabase.push(event);
        return EventsDatabase.length;
    }

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