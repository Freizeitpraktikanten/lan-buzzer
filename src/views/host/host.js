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

/**
 * Player list element
 * @type {Node}
 */
const PLAYER_LIST = document.querySelector('#player-list');

/**
 * Buzzer list element
 * @type {Node}
 */
const BUZZER_LIST = document.querySelector('#buzzer-list');

//#endregion


// create socket on 'host' namespace
/* global io */
const socket = io('/host');

/** @type {Array<Player>} */
const players = [];

/** @type {Array<Buzz>} */
const buzzes = [];


/** @type {ROUND_STATUS} */
let status = ROUND_STATUS.WAITING;

// query for any connected clients on startup
socket.emit('queryClients');

socket.on('clientConnect', (id) => {
  console.debug(`${id} connected`);
});

socket.on('clientDisconnect', (name) => {
  console.debug(`${name} disconnected`);
  const userIndex = players.findIndex(p => p.id === name);
  players.splice(userIndex, 1);
  refresh();
});

socket.on('clientLogin', (player) => {
  console.info(`${player.name} logged in`);
  players.push({ name: player.name, id: player.id });
  refresh();
});

socket.on('buzz', (id) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just buzzed`);
  buzzes.push({ name: player.name, timestamp: Date.now() });
  const payload = { id: player.id, status: PLAYER_STATUS.DISABLED };
  console.debug(payload);
  socket.emit('updateClient', payload);
  refresh();
});

socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}`, ...args);
});

/**
 * Add player name to list
 * @param {string} name
 * @param {string} id
 */
function appendPlayerToList(name, id) {
  const listEntry = document.createElement('li');
  listEntry.innerText = name;
  listEntry.setAttribute('id', id);
  PLAYER_LIST.append(listEntry);
}

/**
 * Add player name to list
 * @param {string} name
 * @param {number} deltaT
 */
function appendBuzzToList(name, deltaT) {
  const listEntry = document.createElement('li');
  listEntry.innerText = `${name} ${deltaT ? '(+' + deltaT + 'ms)' : ''}`.trim();
  BUZZER_LIST.append(listEntry);
}

/**
 * Remove all nodes from player list
 */
function clearPlayerList() {
  PLAYER_LIST.textContent = '';
}

/**
 * Remove all nodes from player list
 */
function clearBuzzList(clearBuzzArray = false) {
  if (clearBuzzArray) {
    buzzes.length = 0;
  }
  BUZZER_LIST.textContent = '';
}

/**
 * Sort players by name, add all to list
 */
function refresh() {
  clearPlayerList();
  players
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(({ name, id }) => {
      appendPlayerToList(name, id);
    });

  clearBuzzList();
  const baseTime = buzzes[0] && buzzes[0].timestamp;
  buzzes
    .forEach(buzz => {
      const timeDiff = buzz.timestamp - baseTime;
      appendBuzzToList(buzz.name, timeDiff);
    });
}

/**
 * Start a new round. Reset all buzzes and notify new round to clients.
 */
function startNewRound() {
  clearBuzzList(true);
  socket.emit('newRound');
}

/**
 * Reset current round, notify clients that haven't buzzed yet
 */
function resetCurrentRound() {
  clearBuzzList(true);
}

/**
 * request local IP from server
 */
function getServerIP() {
  socket.emit('getServerIP', (ip) => {
    console.debug(ip);
  });
}
