import http from 'http';

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
  
});

server.listen(3000, () =>{
  console.log('Eita mundo bom! Na porta 3000.');
});