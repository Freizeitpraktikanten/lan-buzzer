module.exports = {

  /**
   * Handle Client Communication
   */
  clientHandler(socket, clientNamespace, hostNamespace) {
    console.info(`Client connected: ${socket.id}`);
    hostNamespace.emit('clientConnect', socket.id);


    socket.on('disconnect', (reason) => {
      console.info(`Client disconnected: ${reason}`);
      hostNamespace.emit('clientDisconnect', socket.id);
    });

    socket.on('buzz', (name, ack) => {
      console.info('Client buzzed!', name, Date.now());
      ack('Buzz received');
    });

    socket.onAny((event, ...args) => {
      console.info(`received ${event}`);
    });
  },

  /**
   * Handle Host Communication
   */
  hostHandler(socket, hostNamespace, clientNamespace) {
    console.info(`Host connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.info(`Host disconnected: ${reason}`);
    });

    socket.on('queryClients', async cb => {
      const clients = await clientNamespace.allSockets();
      const ce = Array.from(clients.entries(), (v) => v.shift());
      cb(ce);
    });

    socket.onAny((event, ...args) => {
      console.info(`received ${event}`);
    });
  }

};
