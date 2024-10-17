import express from "express";
import {Request, Response, Router} from "express";

//colocar as rotas adicionadas
import {AccountsManager} from "./accounts/accounts";

/*
/signUp
/login

/addNewEvent
/getEvent
/deleteEvent
/evaluateNewEvent

/addFounds
/widrawFounds

/betOnEvent
/finishEvent
/searchEvent

*/

//__________________________________________________
const port = 3000; 
const server = express();
const routes = Router();

routes.get('/', (req: Request, res: Response)=>{
  res.statusCode = 403;
  res.send('Acesso não permitido. Rota default não disponível.');
});



//EXEMPLO DE ROTAS
routes.put('/signUp', AccountsManager.signUpHandler);
routes.post('/login', AccountsManager.loginHandler);
// routes.post('/financial', FinancialManager.getWalletBalanceHandler);

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom! Na porta ${port}.`);
});