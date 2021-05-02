const socket = io('/host');

socket.emit('queryClients', (res) => {
  console.warn(res);
  res.forEach(id => {
    appendPlayer(id, id);
  });
});

socket.onAny((event, ...args) => {
  console.info(`received event: ${event}`);
});

socket.on('clientConnect', (name) => {
  console.info(`-> ${name}`);
  appendPlayer(name, name);
});

socket.on('clientDisconnect', (name) => {
  console.info(`-> ${name}`);
  const userNode = document.querySelector(`[id="${name}"]`);
  userNode.remove();

});


function appendPlayer(name, id) {
  const listEntry = document.createElement('li');
  listEntry.innerText = name;
  listEntry.setAttribute('id', id);
  document.querySelector('#player-list').append(listEntry);
}
