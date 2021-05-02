const path = require('path');
const { clientHandler, hostHandler } = require('./socket');

const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);


const port = process.env.PORT || 3000;

// serve static content
app.use(express.static('src/views'));


// put client here
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/client/client.html'));
});

// put host dashboard here
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/host/host.html'));
});

// socket communication
const clientNamespace = io.of('/');
const hostNamespace = io.of('/host');

clientNamespace.on('connection', (socket) => {
  clientHandler(socket, clientNamespace, hostNamespace);
});

hostNamespace.on('connection', (socket) => {
  hostHandler(socket, hostNamespace, clientNamespace);
});



httpServer.listen(port, () => {
  console.info(`listening on localhost:${port}`);
});
