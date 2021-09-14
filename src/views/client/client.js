//#region typedefs/const

/**
 * @typedef Player
 * @type {object}
 * @property {string} name
 * @property {string} id
 */

const BUZZ_MODE = document.querySelector('#buzz');
const BUZZER_BUTTON = document.querySelector('#buzzer');
const WELCOME_PAGE = document.querySelector('#welcome');
const STATUS_BOX = document.querySelector('#box');
const ANSWER_MODE = document.querySelector('#answerMode');
const ANSWER_LABEL = document.querySelector('#answerModeLabel');
const ANSWER_BOX = document.querySelector('#answer');
const ANSWER_SUBMIT = document.querySelector('#submitAnswer');

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
 * Player status ENUM
 * @readonly
 * @enum {number}
 */
const PLAYER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
};

//#endregion

/* global io */
let socket = io('/');
let playerStatus = PLAYER_STATUS.ENABLED;
let gameMode = GAME_MODE.BUZZER;
/** @type {number} */
let position = null;
/** @type {Player} */
let user = {};

/**
 * load player from localstorage
 */
/** @type {Player} */
const userFromStorage = JSON.parse(localStorage.getItem('user'));
if (userFromStorage) {
  document.querySelector('#playername').value = userFromStorage.name;
}

socket.on('queryClients', () => {
  if (user?.id) {
    socket.emit('login', user);
  }
});

socket.on('updateClient', (payload) => {
  playerStatus = payload.status;
  gameMode = payload.mode;
  position = payload.position;
  showRank();
  refresh();
});

/** 
 * catch any event for debugging purposes
 */
socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}\n`, ...args);
});

function setName() {
  user.name = document.querySelector('#playerName').value;
  if (!user.name) {
    alert('Please enter a name!');
  } else {
    user.id = userFromStorage?.id ?? generateRandomId();
    localStorage.setItem('user', JSON.stringify(user));
    socket.emit('login', user);
  }
}

function showBuzzer() {
  WELCOME_PAGE.style.display = 'none';
  BUZZ_MODE.style.display = 'flex';
  ANSWER_MODE.style.display = 'none';
}

function showAnswerMode() {
  WELCOME_PAGE.style.display = 'none';
  BUZZ_MODE.style.display = 'none';
  ANSWER_MODE.style.display = 'flex';
}

function buzz() {
  if (playerStatus) {
    // Vibration - only on Android
    if (navigator.vibrate) { navigator.vibrate(150); }
    sendBuzz();
    refresh();
  }
}

function showRank() {
  STATUS_BOX.innerText = position ? `${position}.` : 'Warten auf Host';
}

function submitAnswer() {
  const answer = ANSWER_BOX.value;
  if (answer.length > 0) {
    console.debug('Submitted', answer);
    socket.emit('message', answer);
  } else {
    ANSWER_LABEL.innerText = 'Keine leeren Antworten erlaubt';
  }
}

function sendBuzz() {
  console.debug('BUZZ!');
  socket.emit('buzz', (newPlayerStatus) => {
    playerStatus = newPlayerStatus;
  });
}

function refresh() {
  switch (playerStatus) {
    case PLAYER_STATUS.ENABLED:
      BUZZER_BUTTON.textContent = 'BUZZ';
      BUZZER_BUTTON.disabled = false;
      ANSWER_BOX.disabled = false;
      ANSWER_SUBMIT.disabled = false;
      ANSWER_LABEL.innerText = 'Bitte Antwort eingeben';
      ANSWER_BOX.value = '';
      STATUS_BOX.innerText = 'Let\'s buzz it!';
      break;
    case PLAYER_STATUS.DISABLED:
      BUZZER_BUTTON.textContent = 'WAIT';
      BUZZER_BUTTON.disabled = true;
      ANSWER_BOX.disabled = true;
      ANSWER_SUBMIT.disabled = true;
      break;
  }

  switch (gameMode) {
    case GAME_MODE.BUZZER:
      showBuzzer();
      break;
    case GAME_MODE.ANSWERS:
      showAnswerMode();
      break;
  }
}

/**
 * Returns a random alphanumerical id
 *
 * Format: `/[a-zA-Z0-9]{8}/`
 */
function generateRandomId() {
  return Math.random().toString(36).replace('0.', '').substr(0, 8);
}
