const { LogLevel, Logger } = require('./logger');
const { networkInterfaces } = require('os');

//#region typedefs

/**
 * @typedef Player
 * @type {object}
 * @property {string} name
 * @property {string} id
 */

/**
 * @typedef Buzz
 * @type {object}
 * @property {string} name
 * @property {number} timestamp
 */

/**
 * Player status ENUM
 * @readonly
 * @enum {number}
 */
const PLAYER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
};

//#endregion

const logger = new Logger(process.env.NODE_ENV === 'dev' ? LogLevel.DEBUG : LogLevel.INFO);

module.exports = {

  /**
   * Handle Communication Client -> Host
   */
  clientHandler(socket, hostNamespace) {
    /** @type {Player} */
    const client = {
      name: '',
      id: socket.id
    };
    logger.info(`Client connected: ${client.id}`);
    hostNamespace.emit('clientConnect', client.id);

    /**
     * Sign off from host
     */
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${reason}`);
      hostNamespace.emit('clientDisconnect', socket.id);
    });

    /**
     * Confirm connection to host and send user name
     * Receive acknowledgment if successful
     */
    socket.on('login', (playerName, ack) => {
      client.name = playerName;
      logger.info(`User ${client.name} logged in`);
      hostNamespace.emit('clientLogin', client);
      ack();
    });

    /**
     * Forward buzz from client to host
     */
    socket.on('buzz', () => {
      logger.info('Client buzzed!', client.name);
      hostNamespace.emit('buzz', client.id);
    });

    /** 
     * catch any event for debugging purposes
     */
    socket.onAny((event, ...args) => {
      logger.debug(`Received ${event} from a client\n`, ...args);
    });
  },

  /**
   * Handle Communication Host -> Client
   */
  hostHandler(socket, clientNamespace) {
    logger.info(`Host connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Host disconnected: ${reason}`);
    });

    /**
     * request login confirmation from connected clients
     */
    socket.on('queryClients', () => {
      clientNamespace.emit('queryClients');
    });

    /**
     * udpate a single clients player status
     */
    // socket.on('updateClient', ({ clientId, playerStatus }) => {
    socket.on('updateClient', (payload) => {
      logger.debug(payload);
      const client = clientNamespace.sockets.get(payload.id);
      client.emit('updateClient', payload.status);
    });

    /**
     * reset all clients
     */
    socket.on('newRound', () => {
      clientNamespace.emit('updateClient', PLAYER_STATUS.ENABLED);
    });

    /**
     * get local IP form server (assuming same machine as host)
     */
    socket.on('getServerIP', (ack) => {
      const interfaces = networkInterfaces();
      let allInterfaces = [];
      Object.keys(interfaces).forEach(key => {
        allInterfaces = allInterfaces.concat(interfaces[key]);
      });
      let localIP = null;
      try {
        localIP = allInterfaces
          .filter(interface => interface.family === 'IPv4')
          .filter(interface => interface.internal === false)
          .shift()
          .address;
      } catch (e) {
        logger.error(e);
      }
      ack(localIP);
    });

    /** 
     * catch any event for debugging purposes
     */
    socket.onAny((event, ...args) => {
      logger.debug(`Received ${event} from host\n`, ...args);
    });
  }

};
