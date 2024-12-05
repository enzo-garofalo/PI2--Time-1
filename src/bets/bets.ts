import {Request, RequestHandler, Response} from "express";
import { AccountsManager } from "../accounts/accounts";
import { FundsManager } from "../funds/funds";
import { dbFundsManager } from "../funds/databaseFunds";
import { DataBaseManager } from "../db/connection";
import { dbBetsManager } from "./databaseBets";
import { dbEventsManager } from "../events/databaseEvent";
//Falta criar linha no histórico
export namespace betsManager
{
    /* Definição do tipo para uma nova aposta */
    export type newBet = 
    {
        bet: string;           // 'sim' ou 'não' para o evento acontecer
        valuesBet: number;     // Valor da aposta
        fk_ID_User: number;    // ID do usuário que faz a aposta
        fk_ID_Event: number;   // ID do evento no qual a aposta foi feita
    }

    /* Função para validar se todos os dados da aposta estão corretos */
    async function isAllValid(eventId:number, pBet:string, IdUser:number, pBetValue:number, res: Response): Promise<boolean> 
    {
        // if(!AccountsManager.isLoggedIn(req, res)) return; precisa????
        // Verifica se o evento existe
        const event = await dbEventsManager.getEventById(eventId)
        if(event?.[0] === undefined){
            res.status(400).send('Não foi possível encontrar o evento!');
            return false;
        }else if(event[0].STATUS_EVENT !== 'Aprovado'){
            res.status(200).send(`Não é possível apostar no evento!\n\
                Status do evento: ${event[0].STATUS_EVENT}`);
            return false;
        }
   
        // Verifica se a aposta é válida (sim ou não)
        if(pBet.toLowerCase() != 'sim' && pBet.toLowerCase() != 'não'){
            res.statusCode = 400;
            res.send('Faça uma bet válida');
            return false;
        }

        // Verifica o saldo do usuário antes de permitir a aposta
        const userWallet = await DataBaseManager.getWalletByID(IdUser);
        if(userWallet)
        {
            const newTransaction: FundsManager.Historic = {
                fkIdWallet: Number(userWallet[0].ID_WALLET),
                typeTransaction: 'Apostou',
                value: pBetValue,
            };
            
            await dbFundsManager.addLineHistoric(newTransaction);
        }
        const userBalance = userWallet?.[0].BALANCE;

        // Adiciona a linha ao histórico

        if(userBalance === undefined || pBetValue <= 0 || pBetValue > userBalance){
            res.status(400).send(`Não foi possível apostar no evento!\n\
                Saldo disponível: R$ ${userBalance}`);
            return false
        }

        return true
    }

    /* Handler para realizar a aposta no evento */
    export const betOnEventHandler: RequestHandler =
    async (req: Request, res : Response) => 
    {        
        // Verifica se o usuário está logado
        if(!AccountsManager.isLoggedIn(req, res)) return;

        // Busca as informações do usuário com base no token da sessão
        const resultSearchUser = 
        await DataBaseManager.getUserByToken(req.cookies.token);
        
        if(resultSearchUser)
        {

            const IdUser = Number(resultSearchUser[0].ID); // ID do usuário
            const pIdEvent = Number(req.get('idEvent'));  // ID do evento
            const pBet = req.get('acontecera')?.toLowerCase(); // Valor da aposta (sim ou não)
            const pBetValue = Number(req.get('valorAposta'));  // Valor da aposta em números
            console.log(IdUser, pIdEvent, pBet, pBetValue);

            // Verifica se todos os parâmetros foram fornecidos
            if(pIdEvent && pBet && pBetValue)
            {
                // Verifica se os dados da aposta são válidos
                const isValid: boolean = await isAllValid(pIdEvent, pBet, IdUser, pBetValue, res); 
                if (!isValid) return;

                // Cria o objeto para a nova aposta
                const newBet: newBet = {
                    bet : pBet,                // Aposta: 'sim' ou 'não'
                    valuesBet : pBetValue,     // Valor da aposta
                    fk_ID_User : IdUser,       // ID do usuário
                    fk_ID_Event : pIdEvent     // ID do evento
                };            

                // Tenta registrar a aposta no banco de dados
                if (await dbBetsManager.betting(newBet))
                {
                    req.statusCode = 200;
                    res.send("Bet feita.")
                }else{
                    res.statusCode = 409;
                    res.send("Erro inesperado ao fazer o bet.");
                }
                return;
            }else{
                res.statusCode = 400;
                res.send("Parâmetros inválidos ou faltantes");
                return;
            }
        }
    }
}
