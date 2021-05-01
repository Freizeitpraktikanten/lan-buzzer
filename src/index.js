const path = require('path');
const { userHandler, hostHandler } = require('./socket');

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
const userNamespace = io.of('/');
const hostNamespace = io.of('/host');

userNamespace.on('connection', (socket) => {
  userHandler(socket, userNamespace);
});

hostNamespace.on('connection', (socket) => {
  hostHandler(socket, hostNamespace);
});


httpServer.listen(port, () => {
  console.info(`listening on localhost:${port}`);
});
