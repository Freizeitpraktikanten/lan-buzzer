//#region typedefs

/**
 * @typedef Player
 * @type {object}
 * @property {string} name
 * @property {string} id
 */

/**
 * @typedef Reaction
 * @type {object}
 * @property {string} name
 * @property {string} text
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
 * Game mode ENUM
 * @readonly
 * @enum {number}
 */
const GAME_MODE = {
  BUZZER: 0,
  INPUT: 1
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
const reactions = [];


/** @type {ROUND_STATUS} */
let status = ROUND_STATUS.WAITING;

/** @type {GAME_MODE} */
let gameMode = GAME_MODE.BUZZER;

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
  socket.emit('updateClient', { id: player.id, status: PLAYER_STATUS.DISABLED, mode: gameMode });
  refresh();
});

socket.on('buzz', (id) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just buzzed`);
  reactions.push({ name: player.name, timestamp: Date.now(), text: null });
  socket.emit('updateClient', { id: player.id, status: PLAYER_STATUS.DISABLED, mode: gameMode, position: reactions.length });
  refresh();
});

socket.on('message', (id, text) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just submitted an answer`);
  reactions.push({ name: player.name, timestamp: Date.now(), text: text });
  socket.emit('updateClient', { id: player.id, status: PLAYER_STATUS.DISABLED, mode: gameMode });
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
 * @param {Reaction} reaction
 * @param {number} deltaT
 */
function appendBuzzToList(reaction, deltaT) {
  const listEntry = document.createElement('li');
  const hasText = !!reaction.text;
  const time = `${deltaT ? '(+' + deltaT + 'ms)' : ''}`;
  listEntry.innerText = `${reaction.name} ${hasText ? '\n' + reaction.text : time}`.trim();
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
    reactions.length = 0;
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
  const baseTime = reactions[0] && reactions[0].timestamp;
  reactions
    .forEach(reaction => {
      const timeDiff = reaction.timestamp - baseTime;
      appendBuzzToList(reaction, timeDiff);
    });
}

/**
 * Start a new round. Reset all buzzes and notify new round to clients.
 */
function startNewRound() {
  clearBuzzList(true);
  socket.emit('newRound', gameMode);
}

/**
 * Reset current round, clear reaction list, leave buzzed players disabled
 */
function resetCurrentRound() {
  clearBuzzList(true);
}

function switchMode() {
  switch (gameMode) {
    case GAME_MODE.BUZZER:
      gameMode = GAME_MODE.INPUT;
      break;
    case GAME_MODE.INPUT:
      gameMode = GAME_MODE.BUZZER;
      break;
  }
  socket.emit('newRound', gameMode);
  document.querySelector('#modeSwitcher').innerText = `Switch Mode to ${gameMode === GAME_MODE.BUZZER ? 'INPUT' : 'BUZZER'}`;
}
