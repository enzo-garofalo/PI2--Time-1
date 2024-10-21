import OracleDB from "oracledb";
import dotenv from "dotenv"; 
dotenv.config();

export namespace DataBaseManager{
    
    export async function get_connection(){
        let connection: OracleDB.Connection;
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT

        connection = await OracleDB.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONN_STR
        });

        return connection;
    }

    export function get_token(connection:OracleDB.Connection){
        const token = connection.execute(
            `DBMS_RANDOM.STRING('X',32);`
        );

        return token;
    }
}