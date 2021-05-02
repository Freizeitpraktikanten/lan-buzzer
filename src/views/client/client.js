function buzz(socket) {
  console.info('BUZZ!');
  const tik = Date.now();
  let tok = 0;
  socket.emit('buzz', 'NAME', (ack) => {
    tok = Date.now();
    console.warn(ack, `${tok - tik}ms`);
  });
  showRank();
  window.navigator.vibrate(150); //Vibration - Only on Android
}

function showRank(){
  document.getElementById("box").innerText = "Erfolgreich"
}
