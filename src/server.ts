import express from "express";
import {Request, Response, Router} from "express";

//colocar as rotas adicionadas
import { AccountsManager } from "./accounts/accounts";
import { EventsManager } from "./events/events";

/*
/signUp
/login

/addNewEvent
/getEvent
/deleteEvent

/evaluateNewEvent
/finishEvent
/searchEvent

/betOnEvent
/addFounds
/widrawFounds
*/

//__________________________________________________
const port = 3000; 
const server = express();
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
//routes.get('/getEvent', EventsManager.GetEventHandler);

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom! Na porta ${port}.`);
});