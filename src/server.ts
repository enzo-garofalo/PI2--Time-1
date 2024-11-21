import express from "express";
import session from 'express-session';
import {Request, Response, Router} from "express";

import { AccountsManager } from "./accounts/accounts";
import { EventsManager } from "./events/events";
import {FundsManager} from "./funds/funds";
import {betsManager} from "./bets/bets";

import cors from "cors"


const port = 3000; 
export const server = express();


// CORS (Cross-Origin Resource Sharing) é como um segurança na porta de um restaurante.
// Ele controla quem pode acessar recursos de um site. 
// Se um site (origem) tenta acessar dados de outro site, 
// o navegador pergunta se o outro site permite isso.
// Se permitido, o navegador deixa passar; se não, bloqueia o acesso.
// Isso ajuda a proteger contra ataques de segurança, como o Cross-Site Scripting (XSS).
server.use(cors());

declare module 'express-session' {
  interface SessionData {
      token: string;
      role: number;
  }
}
server.use(session({
  secret: 'seuSegredoSeguro',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false,
      httpOnly: true
  }
}));

const routes = Router();

routes.get('/', (req: Request, res: Response)=>{
  res.statusCode = 403;
  res.send('Acesso não permitido. Rota default não disponível.');
});

//Rotas de Accounts
routes.put('/signUp', AccountsManager.signUpHandler);
routes.post('/login', AccountsManager.loginHandler);

//Rotas de Eventos
routes.put('/addNewEvent', EventsManager.addNewEventHandler);
routes.put('/evaluateNewEvent', EventsManager.evaluateNewEventHandler);

routes.get('/searchEvent', EventsManager.searchEventHandler);
routes.get('/getEvent', EventsManager.getEventHandler);

routes.post('/finishEvent', EventsManager.finishEventHandler)
routes.delete('/deleteEvent', EventsManager.deleteEventHandler)

//Rotas de Wallet
routes.put('/addFunds', FundsManager.addNewFundsHandler);
routes.put('/withdrawFunds', FundsManager.withdrawFundsHandler);

//Rotas de bets
routes.put('/betOnEvent', betsManager.betOnEventHandler)

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom!\nNa porta ${port}.`);
});