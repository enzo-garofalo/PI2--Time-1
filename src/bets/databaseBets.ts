import { betsManager } from "../bets/bets";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";


export namespace dbBetsManager {
    // Função principal responsável por registrar uma aposta
    export async function betting(bet: betsManager.newBet) {
        
        // Define o formato de saída da conexão Oracle para objetos, facilitando a manipulação dos dados retornados
        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;
        
        // Estabelece uma conexão com o banco de dados, utilizando a função get_connection do DataBaseManager
        const connection: OracleDB.Connection = await DataBaseManager.get_connection();
        
        try {
            // Primeiro comando SQL: Atualiza o saldo da carteira do usuário, descontando o valor da aposta
            // A tabela WALLETS é modificada para reduzir o saldo (BALANCE) do usuário, identificado pelo FK_ID_USER
            await connection.execute(
               `UPDATE WALLETS
                SET BALANCE = (BALANCE - :valueBet)
                WHERE FK_ID_USER = :idUser`,
                { valueBet: bet.valuesBet, idUser: bet.fk_ID_User } // Parâmetros passados para o SQL (valores da aposta e id do usuário)
            );

            await connection.execute(
                `UPDATE EVENTS
                SET BETS_FUNDS = (BETS_FUNDS + :valueBet)
                WHERE ID_EVENT = :id_event`, 
                {
                    valueBet: bet.valuesBet,
                    id_Event: bet.fk_ID_Event
                }
            )

            // Segundo comando SQL: Insere uma nova aposta na tabela BETS
            // A aposta é registrada com valores como 'sim' ou 'não' (BET), valor da aposta (VALUE_BET), ID do usuário e ID do evento
            await connection.execute(
                `INSERT INTO BETS
                (ID_BET, BET, VALUE_BET, ID_USER, ID_EVENT) 
                VALUES(SEQ_BETS.NEXTVAL, :userBet, :valuesBet, 
                :fk_ID_User, :fk_ID_Event)`,
                {   
                    userBet: bet.bet,               // Tipo da aposta ('sim' ou 'não')
                    valuesBet: bet.valuesBet,       // Valor da aposta
                    fk_ID_User: bet.fk_ID_User,     // ID do usuário que está apostando
                    fk_ID_Event: bet.fk_ID_Event    // ID do evento relacionado à aposta
                }
            );
            
            // Confirma a transação no banco de dados, garantindo que as mudanças sejam persistidas
            await connection.commit();

        } catch (error) {
            // Caso haja um erro durante o processo, exibe o erro no console e retorna false
            console.log(`Erro: ${error}`);
            return false;
        } finally {
            // Garante que a conexão com o banco seja fechada, independentemente de sucesso ou erro
            await connection.close();
        }
        
        // Retorna true indicando que a aposta foi registrada com sucesso
        return true;
    }
}
