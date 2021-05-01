const express = require('express');
const path = require('path');

const app = express();
const port = 3000;


app.use(express.static('src/views'));

// put client here
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/client/client.html'));
});

// put host dashboard here
app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/host/host.html'));
});


app.listen(port, () => {
  console.info(`listening on localhost:${port}`);
});
