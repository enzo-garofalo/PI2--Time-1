import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import { dbBetsManager } from "../db/databaseBets";

export namespace betsManager
{

    /*Criação do type BETS*/

    export type newBet = 
    {
        bet: string;
        valuesBet: number;
        fk_ID_User: number;
        fk_ID_Event: number;
    }

    /*Recebe em qual evento será a aposta, sim ou não para a aposta e o valor da aposta*/

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
            const pBet = req.get('acontecera');
            const pBetValue = Number(req.get('valorAposta'));

            if(pIdEvent && pBet && pBetValue)
            {
                if(pBet != 'sim' && pBet != 'não'){
                    res.statusCode = 400;
                    res.send('Faça uma bet válida');
                    return;
                }

                const newBet: newBet = {
                    /* bet: é a aposta em si
                    // sim para o evento vai ocorrer
                     não para não vai ocorrer*/
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
                }else{
                    res.statusCode = 409;
                    res.send("Erro inesperado ao fazer o bet.");
                }
            }else{
                res.statusCode = 400;
                res.send("Parâmetros inválidos ou faltantes");
            }
        }
    }
}