import OracleDB from "oracledb";

export namespace DataBaseManager{
    
    export async function get_connection(){
        let connection: OracleDB.Connection;
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT

        connection = await OracleDB.getConnection({
            user: "ENZODEV",
            password: '1234',
            connectString: "localhost:1521/XEPDB1"
        });

        return connection;
    }
}