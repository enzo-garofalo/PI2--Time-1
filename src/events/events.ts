import {Request, RequestHandler, Response} from "express";

import { dbEventsManager } from "./databaseEvent";
import { DataBaseManager } from "../db/connection";
import { AccountsManager } from "../accounts/accounts";
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
        FINISH_DATE: Date,
        FK_ID_USER: number | undefined
    }

    export const addNewEventHandler: RequestHandler = async (req: Request, res: Response) => {

        // Verifica se o usuário está logado
        if(!AccountsManager.isLoggedIn(req, res)) return;
    
        // Obtém os parâmetros do cabeçalho da requisição
        const pTitle = req.get('Title');
        const pDescription = req.get('Description');
        const pCategories = req.get('Categories');
        const pFinishDate = req.get('finishDate');
        // Busca o ID do usuário com base no token da sessão
        const id_user = await DataBaseManager.getUserID(req.cookies.token);
        
        // Verifica se todos os parâmetros necessários estão presentes
        if (pTitle && pDescription && pCategories && pFinishDate && id_user) {
            
            // Valida se a data de término é posterior à data atual
            const today = new Date();
            let eventDate = new Date(pFinishDate);
            
            if (eventDate <= today) {
                res.statusCode = 400;
                res.send('Não é possível criar evento na data informada!');
                return;
            }
            
            // Formatar para YYYY-MM-DD para remover a parte do horário

            // Cria o objeto do evento a ser adicionado
            const newEvent: Event = {
                ID_EVENT: undefined,
                TITLE: pTitle,
                DESCRIPTION: pDescription,
                CATEGORIES: pCategories,
                STATUS_EVENT: 'Pendente',
                RESULT_EVENT: undefined,
                REGISTER_DATE: undefined,
                BETS_FUNDS: 0.00,
                FINISH_DATE:  eventDate,
                FK_ID_USER: id_user
            };
    
            // Adiciona o novo evento ao banco de dados
            await dbEventsManager.addNewEvent(newEvent);
            res.statusCode = 200;
            res.send("Novo Evento adicionado.");
        } else {
            // Responde com erro se parâmetros estão ausentes ou inválidos
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes");
        }
    };

    export const evaluateNewEventHandler: RequestHandler =
    async (req: Request, res: Response) => 
    {
        console.log('Cookies recebidos rota de evaluate:', req.cookies);
        console.log('Sessão:', req.cookies);
        // Verifica se o usuário está autenticado e é um moderador (role === 1)
        if(!AccountsManager.isModerator(req, res)) return;

        console.log(`Rota de evaluate\nToken: ${req.cookies.token}`);
        // Recupera o ID do evento da requisição
        const pEventID = req.get('eventID');
    
        // Recupera os parâmetros que indicam se o evento é válido e a razão da decisão
        const pIsValid = req.get('isValid');
        const pReason =  req.get('reason');
    
        // Verifica se os parâmetros essenciais foram enviados
        if(pEventID && pIsValid)
        {
            // Estabelece uma conexão com o banco de dados
            const connection: OracleDB.Connection = 
            await DataBaseManager.get_connection();
    
            // Obtém os dados do evento pelo ID fornecido
            const event = await dbEventsManager.getEventById(Number(pEventID));
    
            // Verifica se o evento existe e se ele ainda está pendente de avaliação
            if(event?.[0] === undefined){
                res.statusCode = 400;  // Status de erro de requisição
                res.send('Não foi possível encontrar evento!');
                return;
            } else if(event[0].STATUS_EVENT !== 'Pendente'){
                res.statusCode = 200;  // Status de sucesso
                res.send(`Evento já avaliado\n Status: ${event[0].STATUS_EVENT}`);
                return;
            }
            
            var newStatus = '';  // Inicializa a variável que armazenará o novo status do evento
    
            // Se o evento é aprovado, define o novo status como 'Aprovado'
            if(pIsValid === 'sim'){
                newStatus = 'Aprovado';
            } else if(pIsValid === 'não'){  // Se o evento é rejeitado
                
                // Caso de rejeição, verifica se um motivo foi fornecido
                if(!pReason){
                    res.statusCode = 400;
                    res.send('Ao reprovar um evento, um motivo deve ser enviado!');
                    return;
                }
                // Obtém o e-mail do usuário que criou o evento para enviar uma notificação
                const email = await dbEventsManager.getUserEmail(Number(pEventID));
                // Obtém o título do evento rejeitado
                const eventTitle = event?.[0].TITLE;
                // Obtém o nome do moderador que avaliou o evento
                var userName = "teste";
                if(req.cookies.token){
                    const userModer = await DataBaseManager.getUserByToken(req.cookies.token);
                    if(userModer)
                        userName = userModer?.[0].COMPLETE_NAME;
                }
                

                // Envia um e-mail de notificação ao usuário se todas as informações necessárias estiverem presentes
                if(email && userName && eventTitle){
                    await emailServiceManager.sendMail(userName, pReason, email, eventTitle);
                    newStatus = 'Reprovado';
                } else {
                    res.statusCode = 400;
                    res.send('Erro inesperado, tente novamente mais tarde!');
                    return;
                }
            } else {
                res.statusCode = 400;
                res.send('Formato de requisição inválido!');
                await connection.close();
                return;
            }
    
            // Atualiza o status do evento no banco de dados
            await dbEventsManager.changeStatusEvent(newStatus, Number(pEventID));
    
            // Obtém a lista de eventos pendentes após a atualização
            const updatedEventsList = await dbEventsManager.getNewEvents();
            if(updatedEventsList?.length === 0) {
                res.statusCode = 200;
                res.send('Não há eventos pendentes!');
            } else {
                res.statusCode = 200;
                res.send(updatedEventsList);  // Retorna a lista de eventos pendentes
            }
            return;
        }
        // Se não foram fornecidos parâmetros de evento, retorna a lista de eventos pendentes
        const newEventsList = await dbEventsManager.getNewEvents();
    
        // Verifica se há eventos pendentes e envia a lista
        if(newEventsList)
        {
            if(newEventsList.length === 0){
                res.statusCode = 200;
                res.send('Não há eventos pendentes!');
            } else {
                res.statusCode = 200;
                res.send(newEventsList);
            }
        } else {
            res.statusCode = 404;  // Status de não encontrado
            res.send('Nenhum evento encontrado!');
            return;
        }
    }

    export const finishEventHandler: RequestHandler = async (req: Request, res: Response) => {
    
        // Verifica se o usuário está logado (sessão válida com token)
        if(!AccountsManager.isLoggedIn(req,res)) return;
    
        // Verifica se o usuário tem permissão de moderador (role !== 0)
        if(!AccountsManager.isModerator(req, res)) return;
    
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
            if (today <= eventFinishDate || event?.[0]?.STATUS_EVENT !== 'aprovado') {
                res.statusCode = 400; // Código 400: Solicitação inválida
                res.send('Não foi possível finalizar evento.\n \
                - Verifique a data de término do evento.\n \
                - Verifique se o evento já foi avaliado.');
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
    }  

    export const searchEventHandler: RequestHandler =
    async (req: Request, res: Response) => {

        if(!AccountsManager.isLoggedIn(req, res)) return; //mudou
        
        const pStringBusca = req.get('stringBusca')

        if(pStringBusca){
            try{
                
                const events = await dbEventsManager.searchEvent(pStringBusca);

                if(events && events.length > 0){
                    res.statusCode = 200;
                    console.log(events);
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
        if(!AccountsManager.isLoggedIn(req, res)) return; //mudou
        

        const pEventID = Number(req.get('id_event'));
        const userToken = req.cookies.token;
        
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
        
        if (!AccountsManager.isLoggedIn(req, res)) return;

        const pStatus = req.get('status');
        const pId = Number(req.get('id'));
        let consulta = '';

        const connection: OracleDB.Connection = await DataBaseManager.get_connection();

        try {
            consulta = ` SELECT * FROM EVENTS WHERE STATUS_EVENT = '${pStatus}'`;
            if(pId) consulta += ` AND ID_EVENT = ${pId}`;

            const result: OracleDB.Result<Event> = await connection.execute(consulta);
            if(result.rows?.length === 0){
                res.statusCode = 200;
                res.send({ array: [] });  // Envia uma lista vazia com a chave 'array' se não houver eventos
            } else {
                res.statusCode = 200;
                res.send({ array: result.rows });  // Envia os dados dentro de um objeto com a chave 'array'
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

    export const getEventQttyHandler: RequestHandler =
    async (req: Request, res: Response) => {
        const pStatus = req.get('status');
        if(pStatus){
            const eventQtty = await dbEventsManager.getEventQtty(pStatus);
            res.status(200).send(eventQtty.rows);
            return;
        } 

        res.status(400).send('Requisição Inválida');
        return;
    }

    export const getEventByPageHandler: RequestHandler =
    async (req: Request, res: Response) =>{
        const pPage = req.get('page');
        const pPageSize = req.get('pageSize');
        const pStatus = req.get('status');
        const pToFinish = req.get('toFinish') === 'false' ? false : Boolean(req.get('toFinish'));  // Verifica se é a string 'false'
        

        if(pPage && pPageSize && pStatus && pToFinish !== undefined){
            console.log(pToFinish)
            const events = await dbEventsManager.getEventsByPage(parseInt(pPage), parseInt(pPageSize), pStatus, pToFinish);
            console.log('Events', events.rows);
            res.status(200).json(events.rows);
        }else{
            res.status(400).send('Requisição inválida - Parâmetros Faltantes');
        }
    }
}
