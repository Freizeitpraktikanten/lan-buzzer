//#region typedefs/const

/**
 * 
 */
const BUZZER_BUTTON = document.querySelector('#buzzer-button');

//#endregion

/* eslint-disable-next-line no-undef */
let socket = io('/');

BUZZER_BUTTON.addEventListener('click', (evt) => {
  console.info('BUZZ!');
  const tik = Date.now();
  let tok = 0;
  socket.emit('buzz', 'NAME', (ack) => {
    tok = Date.now();
    console.warn(ack, `${tok - tik}ms`);
  });
});
