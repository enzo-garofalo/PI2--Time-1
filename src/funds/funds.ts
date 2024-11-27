import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import { dbFundsManager } from "./databaseFunds";
import { AccountsManager } from "../accounts/accounts";
import OracleDB from "oracledb";

export namespace FundsManager{

    /*Cria o tipo Wallet*/
    export type Wallet = {
        ID_WALLET: number | undefined,
        BALANCE: number,
        CREATED_AT: undefined,
        FK_ID_USER: undefined        
    }

    /*Cria o tipo histórico*/
    export type Historic = {
        typeTransaction: string,
        value: number,
        fkIdWallet: number | undefined
    }

    export type historicRow = {
        transactionID: number|undefined;
        typeTransaction: string,
        value: number,
        dateHistoric: string
    }


    /*Recebe o valor que quer colocar na carteira e adiciona no Balance e 
    adiciona linha no histórico*/
    export const addNewFundsHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        if(!AccountsManager.isLoggedIn(req, res)) return;
    
        const pCredit = Number(req.get('Credit'));
        

        if (isNaN(pCredit) || pCredit <= 0) {
            res.statusCode = 400;
            res.send("Valor de crédito inválido.");
            return;
        }
        
        const joinTables = 
        await DataBaseManager.joinTables(req.cookies.token);
            
        if(joinTables)
        {
            const idWallet = joinTables[0].IDWALLET;
            const newCredit: Historic = {
                fkIdWallet: idWallet,
                typeTransaction: 'Crédito',
                value: pCredit
            };
            const updateWallet: Wallet = {
                ID_WALLET: idWallet,
                BALANCE: joinTables[0].BALANCE,
                CREATED_AT: undefined,
                FK_ID_USER: undefined
            };

            if(await dbFundsManager.addLineHistoric(newCredit) && 
            await dbFundsManager.updateBalance(updateWallet, +(newCredit.value))){
                req.statusCode = 200;
                res.send("Novo Valor adicionado.");
            }else{
                res.statusCode = 409;
                res.send("Erro inesperado ao colocar o valor.");
            }
        }else{
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
        return;
    }
    
    export const withdrawFundsHandler: RequestHandler =
    async (req: Request, res: Response) => {
        
        // Verificar se o usuário está logado
        if(!AccountsManager.isLoggedIn(req, res)) return;
    
        // Obtém o tipo de saque ("Pix" ou "Conta bancaria") e o valor a ser debitado
        const pOpcao = (req.get('pixOUconta'));
        let pDebit = Number(req.get('Debit'));
    
        // Validação do tipo de saque
        if(pOpcao !== 'Pix' && pOpcao !== "Conta bancaria") {
            res.statusCode = 400;
            res.send("Erro: Opção inválida.");
            return;
        } else if(pOpcao === "Conta bancaria") {
            // Se a opção for "Conta bancaria", verifica se os dados da conta foram preenchidos
            const pBanco = req.get('banco');
            const pAgencia = req.get('agencia');
            const pNumeroConta = req.get('numero_conta');
    
            if(!pBanco || !pAgencia || !pNumeroConta) {
                res.statusCode = 400;
                res.send("Erro: todos os valores da conta bancária são necessários.");
                return;
            }
        } else if(pOpcao === "Pix") {
            // Se a opção for "Pix", verifica se a chave Pix foi informada
            const pChavePix = req.get('chave_pix');
            
            if(!pChavePix) {
                res.statusCode = 400;
                res.send("Erro: A chave Pix é necessária.");
                return;
            }
        }
        
        // Verifica se o valor a ser debitado é positivo
        if (pDebit <= 0 || isNaN(pDebit)) {
            res.statusCode = 400;
            res.send("Valor de saque inválido.\n\
                Ou não informado!");
            return;
        }
    
        // Busca os dados da carteira do usuário
        const joinTables = await DataBaseManager.joinTables(req.cookies.token);
        
        if (!joinTables || joinTables.length === 0) {
            res.statusCode = 500; // Erro interno do servidor
            res.send("Erro: Não foi possível acessar os dados da conta.");
            return;
        }
    
        const idWallet = joinTables[0].IDWALLET;
        const newCredit: Historic = {
            fkIdWallet: idWallet,
            typeTransaction: 'Débito',
            value: pDebit
        };
        const updateWallet: Wallet = {
            ID_WALLET: idWallet,
            BALANCE: joinTables[0].BALANCE,
            CREATED_AT: undefined,
            FK_ID_USER: undefined
        };
    
        // Verifica se há saldo suficiente para o saque
        if(pDebit <= joinTables[0].BALANCE) 
        {
            // Limita o valor de saque diário
            if(pDebit > 101000) {
                res.statusCode = 400;
                res.send("Erro: Valor máximo de saque por dia é R$ 101.000,00");
                return;
            }
            // Atualiza o histórico e o saldo da carteira se a transação for bem-sucedida
            else if(await dbFundsManager.addLineHistoric(newCredit) && 
            await dbFundsManager.updateBalance(updateWallet, -(newCredit.value))) {
                
                // Calcula a taxa de desconto com base no valor do saque
                let desconto = 0;
                if(pDebit <= 100) {
                    desconto = 0.04;
                } else if(pDebit <= 1000) {
                    desconto = 0.03;
                } else if(pDebit <= 5000) {
                    desconto = 0.02;
                } else if(pDebit <= 100000) {
                    desconto = 0.01;
                }
    
                // Aplica o desconto se houver
                if(desconto > 0) {
                    pDebit -= pDebit * desconto;
                }
    
                res.statusCode = 200;
                res.send(`Valor sacado: ${pDebit}\nTaxa da casa: ${desconto * 100}%`);
            } else {
                res.statusCode = 400;
                res.send("Erro inesperado ao sacar valores.");
            }
        } else {
            res.statusCode = 400;
            res.send(`Valor acima do balanço da carteira - \n\
                Valor disponível R$${joinTables[0].BALANCE}`);
            return;
        }
    }
    
    export const getBalance: RequestHandler = async (req: Request, res: Response) => {
        if (!AccountsManager.isLoggedIn(req, res)) return;
    
        const joinTables = await DataBaseManager.joinTables(req.cookies.token);
        if (!joinTables || joinTables.length === 0) {
            res.statusCode = 500; // Erro interno do servidor
            res.send("Erro: Não foi possível acessar os dados da conta.");
            return;
        }
    
        const balance = joinTables[0].BALANCE;
        
        // Enviar o saldo como número
        res.statusCode = 200;
        res.json({ balance });  // Retorna um objeto com o saldo
    };

    export const getTransactions: RequestHandler = async (req: Request, res: Response) => {
        if (!AccountsManager.isLoggedIn(req, res)) return;

    
        const joinTables = await DataBaseManager.joinTables(req.cookies.token);
        if (!joinTables || joinTables.length === 0) {
            res.statusCode = 500; // Erro interno do servidor
            res.send("Erro: Não foi possível acessar os dados da conta.");
            return;
        }
    
        const idWallet = joinTables[0].IDWALLET;
        const connection: OracleDB.Connection = await DataBaseManager.get_connection();


        try{
            const historic = `
                SELECT * FROM HISTORIC
                WHERE FK_ID_WALLET = ${idWallet}`;

                const historicRows: OracleDB.Result<historicRow> = await connection.execute(historic);
                if(historicRows.rows?.length === 0){
                    res.statusCode = 200;
                    res.send({ array: [] });  // Envia uma lista vazia com a chave 'array' se não houver eventos
                } else {
                    res.statusCode = 200;
                    res.send({ array: historicRows.rows });
                }
        }catch(error){
            console.error("Erro ao obter transações.", error);
            res.statusCode = 500;
            res.send("Erro ao processar a requisição");
        }
        finally{
            await connection.close();
            return;
        }
        
    };
    
}
    