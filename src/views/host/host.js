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
 * @property {string} id
 * @property {number} timestamp
 */

/**
 * Status ENUM
 * @readonly
 * @enum {string}
 */
const ROUND_STATUS = {
  WAITING: 'waiting',
  OPEN: 'open',
  LIMITED: 'limited'
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
/* eslint-disable-next-line no-undef */
const socket = io('/host');

/** @type {Array<Player>} */
const players = [];

/** @type {Array<Buzz>} */
const buzzes = [];


/** @type {ROUND_STATUS} */
let status = ROUND_STATUS.WAITING;

// query for any connected clients on startup
socket.emit('queryClients', (res) => {
  console.warn(res);
  res.forEach(id => {
    players.push({ name: id, id: id });
  });
  refresh();
});

socket.onAny((event, ...args) => {
  console.info(`received event: ${event}`);
});

socket.on('clientConnect', (name) => {
  console.info(`-> ${name}`);
  players.push({ name: name, id: name });
  refresh();
});

socket.on('clientDisconnect', (name) => {
  console.info(`-> ${name}`);
  const userIndex = players.findIndex(p => p.id === name);
  players.splice(userIndex, 1);
  refresh();
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
 * Remove all nodes from player list
 */
function clearPlayerList() {
  PLAYER_LIST.textContent = '';
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
}

/**
 * Start a new round. Reset all buzzes and notify new round to clients.
 */
function startNewRound() {
  BUZZER_LIST.textContent = '';
  buzzes.length = 0;
  socket.emit('newRound');
}

/**
 * Reset current round, notify clients that haven't buzzed yet
 */
function resetCurrentRound() { }


// buzz mock
(() => {
  const now = Date.now();
  buzzes.push(...[
    { id: 'Ricardo', timestamp: now + 123 },
    { id: 'Marcel', timestamp: now + 876 },
    { id: 'Alina', timestamp: now + 1023 },
    { id: 'Fabi', timestamp: now + 1458 },
    { id: 'Chrissi', timestamp: now + 629 }
  ]);
  buzzes.sort((a, b) => a.timestamp - b.timestamp);
  let time = buzzes[0].timestamp;
  buzzes
    .forEach(buzz => {
      const listEntry = document.createElement('li');
      const name = players.find(player => player.id === buzz.id);
      const timeDiff = buzz.timestamp - time;
      listEntry.innerText = `${name || buzz.id} ${timeDiff === 0 ? '' : '(+' + timeDiff + 'ms)'}`;
      BUZZER_LIST.appendChild(listEntry);
    });
})();
