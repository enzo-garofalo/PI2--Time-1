import express from "express";
import {Request, Response, Router} from "express";

const port = 3000; 
const server = express();
const routes = Router();

routes.get('/', (req: Request, res: Response)=>{
  res.statusCode = 403;
  res.send('Acesso não permitido. Rota default não disponível.');
});



//EXEMPLO DE ROTAS
/*routes.put('/signUp', AccountsManager.signUpHandler);
routes.post('/financial', FinancialManager.getWalletBalanceHandler);*/

server.use(routes);

server.listen(port, () =>{
  console.log(`Eita mundo bom! Na porta ${port}.`);
});

/*
const server = http.createServer((req, res) =>{
  if(req.url === '/signUp')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Sign UP");
  }
  else if(req.url === '/login')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Login");
  }
  else if(req.url === '/addNewEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Novo Evento");
  }
  else if(req.url === '/getEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});    
    res.end("Pagina Listar eventos");
  }
  else if(req.url === '/deleteEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});    
    res.end("Pagina Deletar Eventos");   
  }
  else if(req.url === "/evaluateNewEvent")
  {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Pagina de Avaliar novos eventos");
  }
  else if(req.url === '/addFunds')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Adicionar Fundos");
  }
  else if(req.url === '/withdrawFunds')
  {
    res.writeHead(200, {'Content-Type' : "text/plain"});
    res.end("Pagina de Sacar Fundos");
  }
  else if(req.url === '/betOnEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Apostar em evento");
  }
  else if(req.url === '/finishEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Encerrar Evento");
  }
  else if(req.url === '/searchEvent')
  {
    res.writeHead(200, {"Content-Type" : "text/plain"});
    res.end("Pagina de Busca de Eventos");
  }
  
});*/

