import {Request, RequestHandler, Response} from "express";
import { DataBaseManager } from "../db/connection";
import OracleDB from "oracledb";
import { userSession } from "../accounts/userSession";

export namespace FundsManager{

    export type Wallet = {
        idWallet: number | undefined,
        balance: number        
    }

    async function addNewFunds(wallet:Wallet){

        OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

        const connection:OracleDB.Connection = 
            await DataBaseManager.get_connection();

        let attempts = 3;
        let sucessfull = false;

        while(attempts > 0)
        {
            try
            {
                await connection.execute(
                    `INSERT INTO WALLET 
                    (ID_WALLET, BALANCE)
                    VALUES
                    (
                    SEQ_WALLET.NEXTVAL, 
                    :balance
                    )`,
                    {   
                        balance: wallet.balance                         
                    }
                );

            console.log('Novo valor adicionado.');
            sucessfull = true;
            break;
            }
            catch(error){
                console.error(error);
                attempts--;
            }
        }
        await connection.commit();
        await connection.close();
    
        return sucessfull;
    }

    export const addNewFundsHandler: RequestHandler = 
    async (req: Request, res: Response) => {

        const pBalance = Number(req.get('Balance'));

        if(pBalance)
        {
            const newFunds: Wallet = 
            {
                idWallet: undefined,
                balance: pBalance,
            };

            if (await addNewFunds(newFunds))
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
            await DataBaseManager.getIdWallet(id_user[0]);

            if(resultSearch_IdWallet)
            {
                const idWallet = resultSearch_IdWallet[0].ID_WALLET;
                await DataBaseManager.refreshBalance(idWallet);
                
                const qtdSacar = Number(req.get('valorSacar'));
                
                if(await withdrawFunds(idWallet, qtdSacar)){
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

