import {Request, RequestHandler, Response} from "express";
import { dbEventsManager } from "./databaseEvent";
import { DataBaseManager } from "../db/connection";

import { emailServiceManager } from "./emailService";
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
    
        if(req.session.role !== 1 || !req.session.token){
            res.statusCode = 401;
            res.send('Usuário deve estar logado como moderador');
            return;
        }

        const pEventID = req.get('eventID');

        // sim para é aprovado, não para não aprovado
        const pIsValid = req.get('isValid');
        const pReason =  req.get('reason');

        if(pEventID && pIsValid)
        {
            const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();
            
            var newStatus = '';

            if(pIsValid === 'sim'){
                newStatus = 'Aprovado';
            }else if(pIsValid === 'não'){

                if(!pReason){
                    res.statusCode = 400;
                    res.send('Ao reprovar um evento, um motivo deve ser enviado!');
                    return;
                }
                // Colhendo email do user que criou o evento para envia-lo
                const email = await dbEventsManager.getUserEmail(Number(pEventID));
                // Colhendo título do evento recusado
                const event = await dbEventsManager.getEventById(Number(pEventID));
                const eventTitle = event?.[0].TITLE;
                // Colhendo nome do moderador
                const userModer = await DataBaseManager.getUserByToken(req?.session.token);
                const userName = userModer?.[0].COMPLETE_NAME;



                if(email && userName && eventTitle){
                    await emailServiceManager.sendMail(userName, pReason, email, eventTitle);
                    newStatus = 'Reprovado';
                }else{
                    res.statusCode = 400;
                    res.send('Erro inesperado, tente novamente mais tarde!')
                    return;
                }
            }else{
                res.statusCode = 400;
                res.send('Formato de requisição inválido!');
                await connection.close();
                return;
            }

            await dbEventsManager.changeStatusEvent(newStatus, Number(pEventID));

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

    export const finishEventHandler: RequestHandler = async (req: Request, res: Response) => {
    
        // Verifica se o usuário está logado (sessão válida com token)
        if (!req.session.token) {
            res.statusCode = 401; // Código 401: Não autorizado
            res.send("Usuário não está logado");
            return;
        }
    
        // Verifica se o usuário tem permissão de moderador (role !== 0)
        else if (req.session.role === 0) {
            res.statusCode = 401; // Código 401: Não autorizado
            res.send("Rota permitida apenas para moderadores");
            return;
        }
    
        // Obtém o ID do evento e o veredicto de ocorrência do evento a partir do cabeçalho da requisição
        const pIdEvent = Number(req.get('eventId'));
        const pVerdict = req.get('aconteceu'); // 'sim' para aconteceu, 'não' para não aconteceu
    
        // Verifica se o ID do evento e o veredicto foram fornecidos
        if (pIdEvent && pVerdict) {
            
            // Busca o evento no banco de dados pelo ID
            const event = await dbEventsManager.getEventById(pIdEvent);
            
            let eventFinishDate;
            
            // Verifica se o evento possui uma data de término (FINISH_DATE)
            if (event?.[0]?.FINISH_DATE) {
                eventFinishDate = new Date(event[0].FINISH_DATE); // Converte FINISH_DATE em um objeto Date
            } else {
                res.statusCode = 404; // Código 404: Não encontrado
                res.send("Evento não encontrado ou sem data de término.");
                return; // Encerra a execução para evitar continuar com erro
            }
            
            // Obtém a data atual
            const today = new Date();
            
            // Verifica se a data atual é anterior ou igual à data de término do evento
            if (today <= eventFinishDate) {
                res.statusCode = 400; // Código 400: Solicitação inválida
                res.send("O evento ainda não terminou. Ele só pode ser finalizado após a data de término.");
                return; // Encerra a execução para evitar continuar com erro
            }
    
            // Se as verificações passarem, finaliza o evento e distribui os ganhos
            await dbEventsManager.finishEvent(pIdEvent, pVerdict); 
            await dbEventsManager.shareEventFunds(pIdEvent, pVerdict);
            
            res.statusCode = 200; 
            res.send('Evento finalizado e ganhos distribuídos!');
            return;
        } else {
            res.statusCode = 400; // Código 400: Solicitação inválida
            res.send("Formato de requisição inválido.");
            return;
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
