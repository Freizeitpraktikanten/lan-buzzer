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
 * @property {string} playerName
 * @property {string} text
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

/**
 * Game mode ENUM
 * @readonly
 * @enum {number}
 */
const GAME_MODE = {
  BUZZER: 0,
  ANSWERS: 1
};

/**
 * Span to hold the IP of the server
 * @type {Node}
 */
const IP_CONTAINER = document.querySelector('#ip-container');

/**
 * The QRCode destination
 * @type {Node}
 */
const QRCODE = document.querySelector('#qrcode');

/**
 * Number of connected players
 * @type {Node}
 */
const PLAYER_LIST_SUMMARY = document.querySelector('#player-summary');

/**
 * list of all connected players
 * @type {Node}
 */
const PLAYER_LIST = document.querySelector('#player-list');

/**
 * Reaction list header
 * @type {Node}
 */
const REACTION_HEADER = document.querySelector('#reaction-header');

/**
 * List of all player reactions
 * @type {Node}
 */
const REACTION_LIST = document.querySelector('#reaction-list');

/**
 * Button to reset the current round
 * @type {Node}
 */

const BUTTON_RESET = document.querySelector('#button-reset');

/**
 * Button to switch the game mode
 * @type {Node}
 */
const BUTTON_MODE = document.querySelector('#button-mode');

/**
 * Button to reveal blurred answers
 * @type {Node}
 */
const BUTTON_REVEAL = document.querySelector('#button-reveal');

const buzzerSound = new Audio('./buzzer.mp3');

const port = location.port;

//#endregion


// create socket on 'host' namespace
/* global io */
const socket = io('/host');

/** @type {Array<Player>} */
const players = [];

/** @type {Array<Reaction>} */
const reactions = [];

/** @type {GAME_MODE} */
let gameMode = GAME_MODE.BUZZER;

// query for any connected clients on startup
socket.emit('queryClients');
// get servers local IP address
socket.emit('getServerIP', (ip) => {
  const address = `${ip}${port ? ':' + port : ''}`;
  IP_CONTAINER.innerText = address;

  /* global QRCode */
  new QRCode(QRCODE, `http://${address}`);
});

socket.on('clientConnect', (id) => {
  console.debug(`${id} connected`);
  socket.emit('getClient', id);
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
  buzzerSound.play();
  reactions.push({ playerName: player.name, timestamp: Date.now(), text: null });
  socket.emit('updateClient', { id: player.id, status: PLAYER_STATUS.DISABLED, mode: gameMode, position: reactions.length });
  refresh();
});

socket.on('message', (id, text) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just submitted an answer`);
  reactions.push({ playerName: player.name, timestamp: Date.now(), text: text });
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
function appendReactionToList(reaction, deltaT) {
  const listEntry = document.createElement('li');
  const hasText = !!reaction.text;
  // transform deltaT to seconds
  const deltaTs = (deltaT / 1000).toFixed(2);
  const time = `${deltaT ? '(+' + deltaTs + 's)' : ''}`;
  const timeNode = document.createElement('span');
  timeNode.classList.add('time');
  timeNode.innerText = time;

  if (hasText) {
    listEntry.innerText = `${reaction.playerName}:\n${reaction.text}`.trim();
  } else {
    listEntry.innerHTML = `${reaction.playerName}&nbsp;`;
    listEntry.append(timeNode);
  }

  if (gameMode === GAME_MODE.ANSWERS) {
    listEntry.classList.add('blur');
  }
  REACTION_LIST.append(listEntry);
}

/**
 * Remove all nodes from player list
 */
function clearPlayerList() {
  PLAYER_LIST.textContent = '';
}

/**
 * Remove all nodes from player list
 * @param {boolean} clearReactionArray
 */
function clearReactionList(clearReactionArray = false) {
  if (clearReactionArray) {
    reactions.length = 0;
  }
  REACTION_HEADER.innerText = `${gameMode === GAME_MODE.BUZZER ? 'Buzzed players:' : 'Answers:'}`;
  REACTION_LIST.textContent = '';
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
  PLAYER_LIST_SUMMARY.innerText = players.length;

  clearReactionList();
  const baseTime = reactions[0] && reactions[0].timestamp;
  reactions
    .forEach(reaction => {
      const timeDiff = reaction.timestamp - baseTime;
      appendReactionToList(reaction, timeDiff);
    });
}

/**
 * Start a new round. Reset all buzzes and notify new round to clients.
 */
function startNewRound() {
  clearReactionList(true);
  socket.emit('newRound', gameMode);
}

/**
 * Reset current round, clear reaction list, leave buzzed players disabled
 */
function resetCurrentRound() {
  clearReactionList(true);
}

function switchMode() {
  switch (gameMode) {
    case GAME_MODE.BUZZER:
      gameMode = GAME_MODE.ANSWERS;
      break;
    case GAME_MODE.ANSWERS:
      gameMode = GAME_MODE.BUZZER;
      break;
  }
  BUTTON_REVEAL.disabled = gameMode === GAME_MODE.BUZZER;
  BUTTON_REVEAL.style.display = gameMode === GAME_MODE.BUZZER ? 'none' : 'inline-block';
  BUTTON_RESET.style.display = gameMode === GAME_MODE.ANSWERS ? 'none' : 'inline-block';
  socket.emit('newRound', gameMode);
  BUTTON_MODE.innerText = `Switch Mode to ${gameMode === GAME_MODE.BUZZER ? 'ANSWERS' : 'BUZZER'}`;
  clearReactionList(true);
  refresh();
}

function revealAnswers() {
  const blurredAnswers = document.querySelectorAll('.blur');
  blurredAnswers.forEach(node => {
    node.classList.remove('blur');
  });
  socket.emit('updateClients', { status: PLAYER_STATUS.DISABLED });
}
