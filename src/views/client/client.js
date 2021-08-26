//#region typedefs/const

/**
 * 
 */
/*const BUZZER_BUTTON = document.querySelector('#buzzer');*/
const PLAYER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
};

//#endregion

/* eslint-disable-next-line no-undef */
let socket = io('/');
let playerStatus = PLAYER_STATUS.ENABLED;
let player='';

/*BUZZER_BUTTON.addEventListener('click', (evt) => {
  sendBuzz(socket);
  showRank();
  window.navigator.vibrate(150); //Vibration - Only on An,droid
});*/

socket.on('queryClients', () => {
  socket.emit('login', player, () => { });
});

socket.on('updateClient',(newPlayerStatus) => {
  playerStatus=newPlayerStatus;
  refresh();
});

function setName(socket) {
  player=document.getElementById('playerName').value;
  console.info(player+' logged in');
  socket.emit('login', player, (ack) => {
    console.warn(ack, player+' logged in');
  });
  refresh();
  showBuzzer();
}
function showBuzzer() {
  document.getElementById('welcome').style.display='none';
  document.getElementById('buzzer').style.display='flex';
  document.getElementById('box').style.display='flex';
}

function buzz(socket) {
  sendBuzz(socket);
  showRank();
  window.navigator.vibrate(150); //Vibration - Only on Android
}

function showRank(status) {
  
  document.getElementById('box').innerText = 'Status: '+playerStatus;
}

function sendBuzz(socket) {
  if (playerStatus){
    console.info('BUZZ!');
    const tik = Date.now();
    let tok = 0;
    socket.emit('buzz', (newPlayerStatus) => {
      playerStatus=newPlayerStatus;
      tok = Date.now();
      console.info(`${tok - tik}ms`);
    });
    /*document.getElementById('buzzer').style.transform = 'scale(1)';*/
    refresh();
  }
}

function refresh() {
  switch(playerStatus) {
    case PLAYER_STATUS.ENABLED:
      /*document.getElementById('buzzer').style.backgroundColor='red';*/
      document.getElementById('buzzer').textContent='BUZZ';
      document.getElementById('buzzer').disabled = false;
      break;
    case PLAYER_STATUS.DISABLED:
      /*document.getElementById('buzzer').style.backgroundColor='grey';*/
      document.getElementById('buzzer').textContent='WAIT';
      document.getElementById('buzzer').disabled = true;
      break;
  } 
}

/** 
 * catch any event for debugging purposes
 */
socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}\n`, ...args);
});
