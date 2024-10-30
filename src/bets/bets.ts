import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import { dbBetsManager } from "../db/databaseBets";
export namespace betsManager
{
    export type newBet = 
    {
        bet: number;
        valuesBet: number;
        fk_ID_User: number;
        fk_ID_Event: number;
    }


    export const betOnEventHandler: RequestHandler =
    async (req: Request, res : Response) => 
    {
                
        if(!req.session.token)
        {
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }

        const resultSearchUser = 
        await DataBaseManager.getUserByToken(req.session.token);
        
        if(resultSearchUser)
        {
            const IdUser = Number(resultSearchUser[0].ID);
        
            const pIdEvent = Number(req.get('idEvent'));
            const pBet = Number(req.get('aposta'));
            const pBetValue = Number(req.get('valorAposta'));

            if(pIdEvent && pBet && pBetValue)
            {
                const newBet: newBet = 
                {
                    bet : pBet,
                    valuesBet : pBetValue,
                    fk_ID_User : IdUser,
                    fk_ID_Event : pIdEvent
                };            
                //deu bom
                if (await dbBetsManager.betting(newBet))
                {
                    req.statusCode = 200;
                    res.send("Bet feita.")
                } else{
                    res.statusCode = 409;
                    res.send("Erro inesperado ao fazer o bet.");
                }
            }else{
                // const eventsAvaliableToBet = await dbBetsManager.searchForEvents();
            }
        }
    }
}