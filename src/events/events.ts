import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";
import { userSession } from "../accounts/userSession";

/*import { title } from "process";
import { subscribe } from "diagnostics_channel";*/

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

    export type newBet = {
        userBet: number;
        valuesBet: number;
        fk_ID_User: number;
        fk_ID_Event: number;

    }
    async function betting(bet:newBet) {
        
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection: OracleDB.Connection = 
            await DataBaseManager.get_connection();

        let attempts = 3;
        let sucessfull = false;

        while (attempts>0){
            try{
                
                await connection.execute(
                    `INSERT INTO BETS
                    (ID_BET, BET, VALUE_BET, ID_USER, ID_EVENT) VALUES(
                    SEQ_BETS.NEXTVAL,
                    :userBet, :valuesBet, :fk_ID_User, :fk_ID_Event)`,
                    {   userBet: bet.userBet,
                        valuesBet: bet.valuesBet,
                        fk_ID_User: bet.fk_ID_User,
                        fk_ID_Events: bet.fk_ID_Event
                    }
                )
            }catch(error){
                console.error(error);
                sucessfull = true;
                break;
            }
        }
        await connection.commit();
        await connection.close();
    }



function someFunction() {
    const user = userSession.getInstance();
    const email = user.getEmail();

    if (email) {
        console.log("Usuário logado com e-mail:", email);
    } else {
        console.log("Usuário não logado.");
    }
}

}