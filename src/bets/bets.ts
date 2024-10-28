import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";

export namespace betsManager
{
    export type newBet = 
    {
        bet: number;
        valuesBet: number;
        fk_ID_User: number;
        fk_ID_Event: number;
    }

    async function betting(bet:newBet) 
    {    
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        
        const connection: OracleDB.Connection = 
        await DataBaseManager.get_connection();
            await connection.execute
            (
                `INSERT INTO BETS
                (ID_BET, BET, VALUE_BET, ID_USER, ID_EVENT) 
                VALUES( SEQ_BETS.NEXTVAL, :userBet, :valuesBet, 
                :fk_ID_User, :fk_ID_Event)`,
                {   
                    userBet: bet.bet,
                    valuesBet: bet.valuesBet,
                    fk_ID_User: bet.fk_ID_User,
                    fk_ID_Events: bet.fk_ID_Event
                }
            );
        await connection.commit();
        await connection.close();
        return true;
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
                if (await betting(newBet))
                {
                    req.statusCode = 200;
                    res.send("Bet feito.")
                } else{
                    res.statusCode = 409;
                    res.send("Erro inesperado ao fazer o bet.");
                }
            }else{
                res.statusCode = 400;
                res.send("Parâmetros inválidos ou faltantes.");
            }
        }
    }
}