import express from "express";
import session from 'express-session';
import cookieParser from "cookie-parser";
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

const allowedOrigins = ['http://localhost:5501', 'http://192.168.1.2:5501', 'http://192.168.1.5:5501'];
server.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));


server.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// Middleware para cookies
server.use(cookieParser());
server.use(express.json());

declare global {
  namespace Express{
    interface Request {
      token?: string;
      role?: number;
    }
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
routes.get('/isModerator', AccountsManager.isModeratorHandler);

//Rotas de Eventos
routes.put('/addNewEvent', EventsManager.addNewEventHandler);
routes.put('/evaluateNewEvent', EventsManager.evaluateNewEventHandler);

routes.get('/searchEvent', EventsManager.searchEventHandler);
routes.get('/getEvent', EventsManager.getEventHandler);

routes.get('/getEventQtty', EventsManager.getEventQttyHandler);
routes.post('/getEventsByPage', EventsManager.getEventByPageHandler)

routes.post('/finishEvent', EventsManager.finishEventHandler)
routes.delete('/deleteEvent', EventsManager.deleteEventHandler)

//Rotas de Wallet
routes.put('/addFunds', FundsManager.addNewFundsHandler);
routes.put('/withdrawFunds', FundsManager.withdrawFundsHandler);
routes.get('/getBalance', FundsManager.getBalance);

//Rotas de bets
routes.put('/betOnEvent', betsManager.betOnEventHandler)

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom!\nNa porta ${port}.`);
});