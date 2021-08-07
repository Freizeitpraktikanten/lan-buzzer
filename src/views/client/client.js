//#region typedefs/const

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
 * Buzzer button element
 * @type {Node}
 */
const BUZZER_BUTTON = document.querySelector('#buzzer');

//#endregion

// eslint-disable-next-line no-undef
let socket = io('/');
let playerName = null;
let playerStatus = PLAYER_STATUS.DISABLED;

/**
 * load player name from localstorage
 */
document.addEventListener('DOMContentLoaded', () => {
  playerName = localStorage.getItem('userName');
  if (playerName) {
    document.querySelector('#playername').value = playerName;
  }
});

/**
 * resend login event when asked to confirm connection
 */
socket.on('queryClients', () => {
  socket.emit('login', playerName, () => { });
});

/**
 * resend login event when asked to confirm connection
 */
socket.on('newRound', () => {
  playerStatus = PLAYER_STATUS.ENABLED;
  refresh();
});

/**
 * login via event, update UI
 */
function login() {
  playerName = document.querySelector('#playername').value;
  localStorage.setItem('userName', playerName);
  socket.emit('login', playerName, () => {
    document.querySelector('.setup').style.display = 'none';
    document.querySelector('.buzzer').style.display = 'block';
    refresh();
  });
}

/**
 * send buzz event
 */
function sendBuzz() {
  console.debug('BUZZ!');
  if (navigator.vibrate) { navigator.vibrate(50); }
  const tik = Date.now();
  let tok = 0;
  socket.emit('buzz', (newPlayerStatus) => {
    tok = Date.now();
    console.info(`${tok - tik}ms`);
    playerStatus = newPlayerStatus;
    refresh();
  });
}

function refresh() {
  switch (playerStatus) {
    case PLAYER_STATUS.ENABLED:
      BUZZER_BUTTON.disabled = false;
      break;
    case PLAYER_STATUS.DISABLED:
      BUZZER_BUTTON.disabled = true;
      break;
  }
}

function test(e) {
  console.debug(window.event.key);
}
