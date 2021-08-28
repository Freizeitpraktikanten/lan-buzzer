//#region typedefs/const

/**
 * 
 */
const BUZZER_BUTTON = document.getElementById('buzzer');
const WELCOME_PAGE = document.getElementById('welcome');
const STATUS_BOX = document.getElementById('box');
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
let player='';

socket.on('queryClients', () => {
  socket.emit('login', player, () => { });
});

socket.on('updateClient',(payload) => {
  playerStatus=payload.status;
  roundMode=payload.mode;
  refresh();
});

function setName() {
  player=document.getElementById('playerName').value;
  console.info(player+' logged in');
  socket.emit('login', player, (ack) => {
    console.warn(ack, player+' logged in');
  });
  refresh();
  showBuzzer();
}
function showBuzzer() {
  WELCOME_PAGE.style.display='none';
  BUZZER_BUTTON.style.display='flex';
  STATUS_BOX.style.display='flex';
}

function showAnswerMode() {
  BUZZER_BUTTON.style.display='none';
  ANSWER_BOX.style.display='flex';
  ANSWER_SUBMIT.style.display='flex';
}

function buzz() {
  sendBuzz();
  showRank();
  if (navigator.vibrate) {navigator.vibrate(150);} //Vibration - Only on Android
  refresh();
}

function showRank(status) {
  STATUS_BOX.innerText = 'Status: '+playerStatus;
}

function submitAnswer() {
  if (ANSWER_BOX.value.length>0) {
    sendAnswer();
    refresh();
  }else{
    ANSWER_LABEL.innerText='Keine leeren Antworten erlaubt';
  }
}
function sendBuzz() {
  if (playerStatus){
    console.info('BUZZ!');
    socket.emit('buzz', (newPlayerStatus) => {
      playerStatus=newPlayerStatus;
    });
  }
}
function sendAnswer(){
  console.info('Submitted');
  socket.emit('message', (newPlayerStatus) => {
    playerStatus=newPlayerStatus;
  });
  playerStatus=PLAYER_STATUS.DISABLED;
}

function refresh() {
  switch(playerStatus) {
    case PLAYER_STATUS.ENABLED:
      /*document.getElementById('buzzer').style.backgroundColor='red';*/
      BUZZER_BUTTON.textContent='BUZZ';
      BUZZER_BUTTON.disabled = false;
      ANSWER_BOX.disabled = false;
      ANSWER_SUBMIT.disabled = false;
      ANSWER_LABEL.innerText='Bitte Antwort eingeben';
      break;
    case PLAYER_STATUS.DISABLED:
      /*document.getElementById('buzzer').style.backgroundColor='grey';*/
      BUZZER_BUTTON.textContent='WAIT';
      BUZZER_BUTTON.disabled = true;
      ANSWER_BOX.disabled = true;
      ANSWER_SUBMIT.disabled = true;
      ANSWER_LABEL.innerText='Antwort gesendet.';
      break;
  } 
}

/** 
 * catch any event for debugging purposes
 */
socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}\n`, ...args);
});
