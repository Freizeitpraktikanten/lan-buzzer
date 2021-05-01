module.exports = {

  userHandler(socket, namespace) {
    console.info(`User connected: ${socket.id}`);
    socket.on('disconnect', (reason) => {
      console.info(`User disconnected: ${reason}`);
    });

    socket.on('buzz', (name, ack) => {
      console.info('User buzzed!', name, Date.now());
      ack('Buzz received');
    });

    socket.onAny((event, ...args) => {
      console.info(`received ${event}`);
      console.info('/', namespace.sockets.size);
    });
  },

  hostHandler(socket, namespace) {
    console.info(`Host connected: ${socket.id}`);
    socket.on('disconnect', (reason) => {
      console.info(`User disconnected: ${reason}`);
    });

    socket.onAny((event, ...args) => {
      console.info(`received ${event}`);
      console.info('/host', namespace.sockets.size);
    });
  }

};
