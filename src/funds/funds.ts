import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";

import { dbFundsManager } from "../db/databaseFunds";

export namespace FundsManager{

    export type Funds = {
        idWallet: number | undefined,
        typeTransaction: string,
        value: number        
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


        const id_user = 
        await DataBaseManager.getUserID(req.session.token);
                
        if(id_user)
        {
            const resultSearch_IdWallet = 
            await DataBaseManager.getIdWallet(id_user);
            console.log(resultSearch_IdWallet);
            if(resultSearch_IdWallet)
            {
                const idWallet = resultSearch_IdWallet[0].ID_WALLET;
                const newCredit: Funds = {
                    idWallet: idWallet,
                    typeTransaction: 'Credito',
                    value: pCredit
                };
                if(await dbFundsManager.addNewFunds(newCredit))
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
        
    }   
    export async function withdrawFunds(idWallet:number, qtdSacar:number){

        const result = await DataBaseManager.getSaldoAtual(idWallet);
        
        if(result)
        {
            const currentBalance = result[0].BALANCE;
            if(currentBalance < qtdSacar)
            {
                console.log('Erro inesperado ao realizar saque.');
                return false;
            }else{
                await DataBaseManager.newfoundWithdraw(qtdSacar, idWallet);
                return true;
            }
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
            
        const connection:OracleDB.Connection = 
        await DataBaseManager.get_connection();

        const id_user = 
        await DataBaseManager.getUserID(req.session.token);
        
        if(id_user)
        {
            const resultSearch_IdWallet = 
            await DataBaseManager.getIdWallet(id_user);

            if(resultSearch_IdWallet)
            {
                const idWallet = resultSearch_IdWallet[0].ID_WALLET;
                await DataBaseManager.refreshBalance(idWallet);
                
                const qtdSacar = Number(req.get('valorSacar'));
                
                if(await withdrawFunds(idWallet, qtdSacar))
                {
                   res.statusCode = 200
                   res.send("Saque realizado com sucesso.");
                }else{
                    res.statusCode = 409
                    res.send("Erro inesperado ao realizar saque. ")
                }
            }
        }
    }         
}
    
