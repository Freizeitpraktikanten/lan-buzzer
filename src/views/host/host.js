//#region typedefs

/**
 * @typedef Player
 * @type {object}
 * @property {string} name
 * @property {string} id
 * @property {number} score
 * @property {string} sessionId
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

const knownEvents = [
  'buzz',
  'clientConnect',
  'clientDisconnect',
  'clientLogin',
  'message'
];

/**
 * Span to hold the IP of the server
 */
const IP_CONTAINER = document.querySelector('#ip-container');

/**
 * The QRCode destination
 */
const QRCODE = document.querySelector('#qrcode');

/**
 * Number of connected players
 */
const PLAYER_LIST_SUMMARY = document.querySelector('#player-summary');

/**
 * list of all connected players
 */
const PLAYER_TABLE = document.querySelector('#player-table');
const TABLE_BODY = document.querySelector('#table-body');

/**
 * Reaction list header
 */
const REACTION_HEADER = document.querySelector('#reaction-header');

/**
 * List of all player reactions
 */
const REACTION_LIST = document.querySelector('#reaction-list');

/**
 * Button to reset the current round
 */
const BUTTON_RESET = document.querySelector('#button-reset');

/**
 * Button to switch the game mode
 */
const BUTTON_MODE = document.querySelector('#button-mode');

/**
 * Button to reveal blurred answers
 */
const BUTTON_REVEAL = document.querySelector('#button-reveal');

/**
 * Button to clear local storage
 */
const BUTTON_RESET_STORAGE = document.querySelector('#button-reset-storage');

const buzzerSound = new Audio('./buzzer.mp3');

const port = location.port;

//#endregion


// create socket on '/host' namespace
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

//#region socket events

socket.on('clientConnect', (sessionId) => {
  console.debug(`${sessionId} connected`);
  socket.emit('getClient', sessionId);
});

socket.on('clientDisconnect', (sessionId) => {
  console.debug(`${sessionId} disconnected`);
  removePlayer(sessionId);
  refresh();
});

socket.on('clientLogin', (player) => {
  console.info(`${player.name} logged in`);
  addPlayer(player);
  socket.emit('updateClient', { sessionId: player.sessionId, status: PLAYER_STATUS.DISABLED, mode: gameMode });
  refresh();
});

socket.on('buzz', (id) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just buzzed`);
  buzzerSound.play();
  reactions.push({ playerName: player.name, timestamp: Date.now(), text: null });
  socket.emit('updateClient', { sessionId: player.sessionId, status: PLAYER_STATUS.DISABLED, mode: gameMode, position: reactions.length });
  refresh();
});

socket.on('message', (id, text) => {
  const player = players.find(p => p.id === id);
  console.info(`${player.name} just submitted an answer`);
  reactions.push({ playerName: player.name, timestamp: Date.now(), text: text });
  socket.emit('updateClient', { sessionId: player.sessionId, status: PLAYER_STATUS.DISABLED, mode: gameMode });
  refresh();
});

socket.onAny((event, ...args) => {
  if (!knownEvents.includes(event)) {
    console.debug(`received event: ${event}`, ...args);
  }
});

//#endregion

/**
 * Add player to local array, read score from localstorage if available
 * @param {Player} player
 */
function addPlayer(player) {
  /** @type {Array<Player>} */
  const playerFromStorage = JSON.parse(localStorage.getItem(`player_${player.id}`));
  const tempPlayer = {
    id: player.id,
    sessionId: player.sessionId,
    score: playerFromStorage?.score ?? 0,
    name: player.name
  };
  players.push(tempPlayer);
  localStorage.setItem(`player_${player.id}`, JSON.stringify(tempPlayer));
  return;
}

/**
 * @param {string} sessionId
 */
function removePlayer(sessionId) {
  const userIndex = players.findIndex(p => p.sessionId === sessionId);
  players.splice(userIndex, 1);
  return;
}

/**
 * Add player name to list
 * @param {Player} player
 */
function appendPlayerToList(player) {
  const tableRow = document.createElement('tr');
  tableRow.setAttribute('id', player.id);
  const nameCell = document.createElement('td');
  const scoreCell = document.createElement('td');
  nameCell.innerText = player.name;
  scoreCell.innerText = player.score;

  const buttonCell = document.createElement('td');
  buttonCell.classList.add('score-buttons');
  const plusButton = document.createElement('button');
  plusButton.innerText = '+';
  plusButton.setAttribute('onclick', `updateScore('${player.id}', 1)`);
  const minusButton = document.createElement('button');
  minusButton.innerText = '-';
  minusButton.setAttribute('onclick', `updateScore('${player.id}', -1)`);
  buttonCell.append(plusButton, minusButton);

  tableRow.append(nameCell, scoreCell, buttonCell);
  TABLE_BODY.append(tableRow);
  return;
}

/**
 * Add player name to list
 * @param {Reaction} reaction
 * @param {number} [deltaT]
 */
function appendReactionToList(reaction, deltaT) {
  const listEntry = document.createElement('li');
  // transform deltaT to seconds
  const deltaTs = (deltaT / 1000).toFixed(2);
  const time = `${deltaT ? '(+' + deltaTs + 's)' : ''}`;
  const timeElement = document.createElement('span');
  timeElement.classList.add('time');
  timeElement.innerText = time;

  if (reaction.text) {
    listEntry.innerText = `${reaction.playerName}:\n${reaction.text}`.trim();
  } else {
    listEntry.innerHTML = `${reaction.playerName}&nbsp;`;
    listEntry.append(timeElement);
  }

  if (gameMode === GAME_MODE.ANSWERS) {
    listEntry.classList.add('blur', 'ellipsis');
  }
  REACTION_LIST.append(listEntry);
}

/**
 * Remove all nodes from player list
 */
function clearPlayerList() {
  TABLE_BODY.textContent = '';
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
    .forEach(player => {
      localStorage.setItem(`player_${player.id}`, JSON.stringify(player));
      appendPlayerToList(player);
    });
  PLAYER_LIST_SUMMARY.innerText = players.length;

  clearReactionList();
  const baseTime = reactions[0]?.timestamp;
  reactions
    .forEach(reaction => {
      const timeDiff = reaction.timestamp - baseTime;
      appendReactionToList(reaction, timeDiff);
    });

  if (players.length > 0 && reactions.length === players.length) {
    REACTION_HEADER.innerText += ' ✔';
  }
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
    node.classList.remove('blur', 'ellipsis');
  });
  socket.emit('updateClients', { status: PLAYER_STATUS.DISABLED });
}

/**
 * 
 * @param {string} playerId 
 * @param {number} score 
 */
function updateScore(playerId, score) {
  players
    .find(p => p.id === playerId)
    .score += score;
  refresh();
}

/**
 * Reset all points and clear localstorage
 */
function clearStorage() {
  if (confirm('You sure?')) {
    players.forEach(p => p.score = 0);
    localStorage.clear();
    refresh();
  }
}
