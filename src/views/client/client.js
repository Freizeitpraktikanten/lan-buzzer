//#region typedefs/const

/**
 * 
 */
const BUZZER_BUTTON = document.querySelector('#buzzer');

//#endregion

/* eslint-disable-next-line no-undef */
let socket = io('/');

BUZZER_BUTTON.addEventListener('click', (evt) => {
  sendBuzz(socket);
  showRank();
  window.navigator.vibrate(150); //Vibration - Only on Android
});

function showRank() {
  document.getElementById('box').innerText = 'Erfolgreich';
}

function sendBuzz(socket) {
  console.info('BUZZ!');
  const tik = Date.now();
  let tok = 0;
  socket.emit('buzz', 'NAME', (ack) => {
    tok = Date.now();
    console.warn(ack, `${tok - tik}ms`);
  });
}

/** 
 * catch any event for debugging purposes
 */
socket.onAny((event, ...args) => {
  console.debug(`received event: ${event}\n`, ...args);
});
