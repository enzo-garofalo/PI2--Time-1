import OracleDB from "oracledb";
import dotenv from "dotenv";
dotenv.config(); 

import { DataBaseManager } from "./connection";


export namespace dbEventsMangaer
{
    export async function finishEvent(idEvent: number, verdictCode: number)
    {
        let connection = await DataBaseManager.get_connection();
        connection.execute(
           `UPDATE EVENTS
            SET RESULT_EVENT = :verdictCode,
            STATUS_EVENT = 2
            WHERE ID_EVENT = :idEvent`, 
            { verdictCode: verdictCode, idEvent: idEvent }
        );

    }
}
