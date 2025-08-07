const express = require('express');
const app = express();
const { exec } = require('child_process');

app.get('/', (req, res) => {
  res.send('🤖 Afshuu Bot is Online!');
});

app.get('/start', (req, res) => {
  exec('node bot.js', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.send('❌ Failed to start bot.');
    }
    res.send('✅ Bot started.');
  });
});

app.listen(3000, () => {
  console.log('Control server listening on port 3000');
});