//#region typedefs/const

/**
 * 
 */
const BUZZ_MODE = document.getElementById('buzz');
const BUZZER_BUTTON = document.getElementById('buzzer');
const WELCOME_PAGE = document.getElementById('welcome');
const STATUS_BOX = document.getElementById('box');
const ANSWER_MODE = document.getElementById('answerMode');
const ANSWER_LABEL = document.getElementById('answerModeLabel');
const ANSWER_BOX = document.getElementById('answer');
const ANSWER_SUBMIT = document.getElementById('submitAnswer');
const ROUND_MODE = {
  BUZZER: 0,
  INPUT: 1
};
const PLAYER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
};

//#endregion

/* eslint-disable-next-line no-undef */
let socket = io('/');
let playerStatus = PLAYER_STATUS.ENABLED;
let roundMode = ROUND_MODE.BUZZER;
let position = 0;
let player = '';

socket.on('queryClients', () => {
  if (player) { socket.emit('login', player, () => { }); }
});

socket.on('updateClient', (payload) => {
  console.info(payload.status + ' ' + payload.mode + ' ' + payload.position);
  playerStatus = payload.status;
  roundMode = payload.mode;
  position = payload.position;
  showRank();
  refresh();
});

function setName() {
  player = document.getElementById('playerName').value;
  console.info(player + ' logged in');
  socket.emit('login', player, (ack) => {
    console.warn(ack, player + ' logged in');
  });
  refresh();
  showBuzzer();
}
function showBuzzer() {
  WELCOME_PAGE.style.display = 'none';
  BUZZ_MODE.style.visibility = 'visible';
  ANSWER_MODE.style.visibility = 'hidden';
}

function showAnswerMode() {
  WELCOME_PAGE.style.display = 'none';
  BUZZ_MODE.style.visibility = 'hidden';
  ANSWER_MODE.style.visibility = 'visible';
}

function buzz() {
  if (playerStatus) {
    sendBuzz();
    if (navigator.vibrate) { navigator.vibrate(150); } //Vibration - Only on Android
    refresh();
  }
}

function showRank() {
  STATUS_BOX.innerText = position ? position + '.' : 'Warten auf Host';
}

function submitAnswer() {
  if (ANSWER_BOX.value.length > 0) {
    sendAnswer();
    //refresh();
  } else {
    ANSWER_LABEL.innerText = 'Keine leeren Antworten erlaubt';
  }
}
function sendBuzz() {
  console.info('BUZZ!');
  socket.emit('buzz', (newPlayerStatus) => {
    playerStatus = newPlayerStatus;
  });
}
function sendAnswer() {
  console.info('Submitted');
  socket.emit('message', ANSWER_BOX.value);
}

function refresh() {
  switch (playerStatus) {
    case PLAYER_STATUS.ENABLED:
      /*document.getElementById('buzzer').style.backgroundColor='red';*/
      BUZZER_BUTTON.textContent = 'BUZZ';
      BUZZER_BUTTON.disabled = false;
      ANSWER_BOX.disabled = false;
      ANSWER_SUBMIT.disabled = false;
      ANSWER_LABEL.innerText = 'Bitte Antwort eingeben';
      ANSWER_BOX.value = '';
      STATUS_BOX.innerText = 'Let\'s buzz it';
      break;
    case PLAYER_STATUS.DISABLED:
      /*document.getElementById('buzzer').style.backgroundColor='grey';*/
      BUZZER_BUTTON.textContent = 'WAIT';
      BUZZER_BUTTON.disabled = true;
      ANSWER_BOX.disabled = true;
      ANSWER_SUBMIT.disabled = true;
      ANSWER_LABEL.innerText = 'Antwort gesendet.';
      break;
  }
  switch (roundMode) {
    case ROUND_MODE.BUZZER:
      showBuzzer();
      break;
    case ROUND_MODE.INPUT:
      showAnswerMode();
      break;
  }
}

/** 
 * catch any event for debugging purposes
 */
socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}\n`, ...args);
});
