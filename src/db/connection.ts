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

    export async function getUserID(connection:OracleDB.Connection, token:string){
        const userID : OracleDB.Result<number>  = 
            await connection.execute(
                `SELECT ID FROM ACCOUNTS
                WHERE TOKEN = :token`,
                {token}
        );
        return userID;
    }
}