import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import { dbFundsManager } from "./databaseFunds";

export namespace FundsManager{

    /*Cria o tipo Wallet*/
    export type Wallet = {
        idWallet: number | undefined,
        balance: number        
    }

    /*Cria o tipo histórico*/
    export type Historic = {
        typeTransaction: string,
        value: number,
        fkIdWallet: number | undefined
    }

    /*Recebe o valor que quer colocar na carteira e adiciona no Balance e 
    adiciona linha no histórico*/
    export const addNewFundsHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        if(!req.session.token)
            {
                res.statusCode = 401;
                res.send('Usuário não está logado!');
                return;
            }
    
            const pCredit = Number(req.get('Credit'));
            
    
            if (isNaN(pCredit) || pCredit <= 0) {
                res.statusCode = 400;
                res.send("Valor de crédito inválido.");
                return;
            }
            
            const joinTables = 
            await DataBaseManager.joinTables(req.session.token);
                
            console.log(joinTables)
            if(joinTables)
            {
            
                    const idWallet = joinTables[0].IDWALLET;
                    const newCredit: Historic = {
                        fkIdWallet: idWallet,
                        typeTransaction: 'Credito',
                        value: pCredit
                    };
                    const updateWallet: Wallet = {
                        idWallet: idWallet,
                        balance: joinTables[0].BALANCE
                    };
    
                    if(await dbFundsManager.addLineHistoric(newCredit) && await dbFundsManager.upDateBalance(updateWallet, +(newCredit.value)))
                    {
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
    }
    
    export const withdrawFundsHandler: RequestHandler =
    async (req: Request, res: Response) => {
        
        // Verificar se o user está logado
        if(!req.session.token){
            res.statusCode = 401;
            res.send('Usuário não está logado!');
            return;
        }
        const pOpcao = (req.get('pixOUconta'));
        let pDebit = Number(req.get('Debit'));

        if(pOpcao !== 'Pix' && pOpcao !== "Conta bancaria"){
            res.statusCode = 400;
            res.send("Erro: Opcão inválida.")
            return;
        }
        else if(pOpcao == "Conta bancaria"){
            const pBanco = req.get('banco');
            const pAgencia = req.get('agencia');
            const pNumeroConta = req.get('numero_conta');

            if(!pBanco || !pAgencia || !pNumeroConta){
                res.statusCode = 400;
                res.send("Erro: todos os valores da conta bancária são necessários.")
                return;
            }
        }
        else if(pOpcao == "Pix"){
            const pChavePix = req.get('chave_pix');// e como validar? porque a chave pode ser CPF, CNPJ, EMAIL, TELEFONE, CHAVE, ALEATORIA...
            
            if(!pChavePix){
                res.statusCode = 400;
                res.send("Erro: A chave Pix é necessária.");
                return;
            }
        }

        if (isNaN(pDebit) || pDebit <= 0) {
            res.statusCode = 400;
            res.send("Valor de saque inválido.");
            return;
        }
        const joinTables = 
            await DataBaseManager.joinTables(req.session.token);
        
        if (!joinTables || joinTables.length === 0) {
            res.statusCode = 500; //quando ocorre erro no lado do servidor sem saber o erro
            res.send("Erro: Não foi possível acessar os dados da conta.");
            return;
        }

        if(joinTables && joinTables.length > 0){

                const idWallet = joinTables[0].IDWALLET;
                const newCredit: Historic = {
                    fkIdWallet: idWallet,
                    typeTransaction: 'Debito',
                    value: pDebit
                };
                const updateWallet: Wallet = {
                    idWallet: idWallet,
                    balance: joinTables[0].BALANCE
                };

                if(await dbFundsManager.addLineHistoric(newCredit) && await dbFundsManager.upDateBalance(updateWallet, -(newCredit.value)))
                {
                    if(joinTables[0].BALANCE >= pDebit){

                        if(pDebit > 101000){
                            res.statusCode = 400;
                            res.send("Erro: Valor máximo de saque por dia é R$ 101.000,00");
                            return;
                        }

                        let desconto = 0;
        
                         if(pDebit <= 100){
                            desconto = 0.04;
        
                         }else if(pDebit <= 1000){
                            desconto = 0.03;
        
                         }else if(pDebit <=5000){
                            desconto = 0.02;
        
                         }else if(pDebit <=100000){
                            desconto = 0.01;
                        }
        
                        if(desconto > 0){
                            pDebit -= pDebit * desconto;
                        }

                    res.statusCode = 200;
                    res.send("Valor sacado.");
                }else{
                    res.statusCode = 400;
                    res.send("Erro inesperado ao sacar valor.");
                }

            }else{
                res.statusCode = 400;
                res.send(`Valor acima do balanço da carteira - Valor disponível ${joinTables[0].BALANCE}`)
            }
        }
    }         
}
    