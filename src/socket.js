const { LogLevel, Logger } = require('./logger');
const { networkInterfaces } = require('os');

//#region typedefs

/**
 * @typedef Player
 * @type {object}
 * @property {string} name
 * @property {string} id
 * @property {string} sessionId
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

const knownEventsClient = [
  'disconnect',
  'login',
  'buzz',
  'message'
];

const knownEventsHost = [
  'disconnect',
  'queryClients',
  'getClient',
  'updateClient',
  'updateClients',
  'newRound',
  'getServerIP'
];

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
      id: null,
      sessionId: socket.id
    };
    logger.info(`Client connected: ${client.sessionId}`);
    hostNamespace.emit('clientConnect', client.sessionId);

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
    socket.on('login', (user) => {
      client.name = user.name;
      client.id = user.id;
      logger.info(`User ${client.name} logged in`);
      hostNamespace.emit('clientLogin', client);
    });

    /**
     * Forward buzz from client to host
     */
    socket.on('buzz', () => {
      logger.info('Client buzzed!', client.name);
      hostNamespace.emit('buzz', client.id);
    });

    /**
     * Forward input from client to host
     */
    socket.on('message', (text) => {
      logger.info('Client sent text!', client.name, text);
      hostNamespace.emit('message', client.id, text);
    });

    /** 
     * catch any event for debugging purposes
     */
    socket.onAny((event, ...args) => {
      if (!knownEventsClient.includes(event)) {
        logger.debug(`Received ${event} from a client\n`, ...args);
      }
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
     * request login confirmation from connected clients
     */
    socket.on('getClient', (id) => {
      const client = clientNamespace.sockets.get(id);
      client.emit('queryClients');
    });

    /**
     * udpate a single clients player status
     */
    socket.on('updateClient', (payload) => {
      logger.debug(payload);
      const client = clientNamespace.sockets.get(payload.sessionId);
      client.emit('updateClient', { status: payload.status, mode: payload.mode, position: payload.position });
    });

    /**
     * udpate a single clients player status
     */
    socket.on('updateClients', (payload) => {
      logger.debug(payload);
      clientNamespace.emit('updateClient', { status: payload.status });
    });

    /**
     * reset all clients
     */
    socket.on('newRound', (gameMode) => {
      clientNamespace.emit('updateClient', { status: PLAYER_STATUS.ENABLED, mode: gameMode });
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
      if (!knownEventsHost.includes(event)) {
        logger.debug(`Received ${event} from host\n`, ...args);
      }
    });
  }

};
