import express from "express";
import session from 'express-session';
import {Request, Response, Router} from "express";


//colocar as rotas adicionadas
import { AccountsManager } from "./accounts/accounts";
import { EventsManager } from "./events/events";
import {FundsManager} from "./funds/funds";

/*
/signUp
/login

/getEvent
/deleteEvent

/finishEvent
/searchEvent

/betOnEvent (falta testar)
/addFounds
/widrawFounds
*/

//__________________________________________________
const port = 3000; 
export const server = express();

declare module 'express-session' {
  interface SessionData {
      token: string;
      role: number;
  }
}
server.use(session({
  secret: 'key', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
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

//Rotas de Wallet
routes.put('/addFunds', FundsManager.addNewFundsHandler);
routes.get('/withdrawFunds', FundsManager.withdrawFundsHandler);

//Rotas de bets
routes.put('/betOnEvent')

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom!\nNa porta ${port}.`);
});