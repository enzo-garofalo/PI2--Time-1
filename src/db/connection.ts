import OracleDB from "oracledb";

export namespace DataBaseManager{
    
    export async function get_connection(){
        let connection: OracleDB.Connection;
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT

        connection = await OracleDB.getConnection({
            user: "ADMIN",
            password: '',
            connectString: "()"
        });

        return connection;
    }
}