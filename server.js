const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// health check
app.get('/healthz', (req, res) => res.type('text').send('ok'));

// fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Rigsta starter running on http://${HOST}:${PORT}`);
});
