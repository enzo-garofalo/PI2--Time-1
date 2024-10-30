import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";

import { dbFundsManager } from "../db/databaseFunds";

export namespace FundsManager{

    export type Wallet = {
        idWallet: number | undefined,
        balance: number        
    }

    export type Historic = {
        typeTransaction: string,
        value: number,
        fkIdWallet: number | undefined
    }

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
        const pDebit = Number(req.get('Debit'));
            
    
        if (isNaN(pDebit) || pDebit <= 0) {
            res.statusCode = 400;
            res.send("Valor de saque inválido.");
            return;
        }
        const joinTables = 
            await DataBaseManager.joinTables(req.session.token);

        if(joinTables){

            if(joinTables[0].BALANCE >= pDebit){

                //verificação do valor para taxar!
                if(pDebit <= 100){
                    //4%
                }else if(pDebit <= 1000){
                    //3%
                }else if(pDebit <=5000){
                    //2%
                }else if(pDebit <=100000){
                    //1%
                }else{
                    //Isento
                }
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
                    req.statusCode = 200;
                    res.send("Valor sacado.");
                }else{
                    res.statusCode = 409;
                    res.send("Erro inesperado ao sacar valor.");
                }

            }else{
                res.statusCode = 400;
                res.send(`Valor acima do balanço da carteira - Valor disponível ${joinTables[0].BALANCE}`)
            }
        }
        
    }         
}
    
