const { LogLevel, Logger } = require('./logger');

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
 * Round status ENUM
 * @readonly
 * @enum {string}
 */
const ROUND_STATUS = {
  WAITING: 'waiting',
  OPEN: 'open',
  LIMITED: 'limited'
};

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
    let client = {
      name: '',
      id: socket.id
    };
    logger.info(`Client connected: ${client.id}`);
    hostNamespace.emit('clientConnect', client.id);


    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${reason}`);
      hostNamespace.emit('clientDisconnect', socket.id);
    });

    socket.on('login', (playerName, ack) => {
      client.name = playerName;
      logger.info(`User ${client.name} logged in`);
      hostNamespace.emit('clientLogin', client);
      ack('Login acknowledged');
    });

    socket.on('buzz', (ack) => {
      logger.info('Client buzzed!', client.name, Date.now());
      hostNamespace.emit('buzz', client.id);
      ack(PLAYER_STATUS.DISABLED);
    });

    socket.onAny((event, ...args) => {
      logger.debug(`Received ${event} from a client`);
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

    socket.on('queryClients', () => {
      clientNamespace.emit('queryClients');
    });

    socket.on('newRound', () => {
      clientNamespace.emit('newRound');
    });

    socket.onAny((event, ...args) => {
      logger.debug(`Received ${event} from host`);
    });
  }

};
