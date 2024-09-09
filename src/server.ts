import http from 'http';

const server = http.createServer((req, res) =>{
  res.writeHead(200, {"Content-Type" : "Text-Plain"});
  res.end("Servidor da PucBet funcionando");
});

server.listen(3000, () =>{
  console.log('Eita mundo bom! Na porta 3000.');
});