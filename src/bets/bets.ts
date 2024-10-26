import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";
import { userSession } from "../accounts/userSession";


export namespace betsManager
{
    export type newBet = 
    {
        userBet: number;
        valuesBet: number;
        fk_ID_User: number;
        fk_ID_Event: number;
    }

    function someFunction() 
    {
        const user = userSession.getInstance();
        const email = user.getEmail();
    
        if(email) 
        {
            console.log("Usuário logado com e-mail:", email);
        }else{
            console.log("Usuário não logado.");
        }
    }

    async function betting(bet:newBet) 
    {    
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        
        const connection: OracleDB.Connection = 
            await DataBaseManager.get_connection();

        let attempts = 3;
        let sucessfull = false;

        while (attempts>0)
        {
            try
            {
                await connection.execute(
                    `INSERT INTO BETS
                    (ID_BET, BET, VALUE_BET, ID_USER, ID_EVENT) VALUES(
                    SEQ_BETS.NEXTVAL,
                    :userBet, :valuesBet, :fk_ID_User, :fk_ID_Event)`,
                    {   
                        userBet: bet.userBet,
                        valuesBet: bet.valuesBet,
                        fk_ID_User: bet.fk_ID_User,
                        fk_ID_Events: bet.fk_ID_Event
                    }
                )
                sucessfull = true;
            }catch(error){
                console.error(error);
                break;
            }
        }
        await connection.commit();
        await connection.close();
        return sucessfull;
    }

}