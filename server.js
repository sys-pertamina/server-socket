// server.js
const express = require('express');
const axios = require('axios'); // <== tambahin axios
const app = express();

// supaya bisa baca body text/plain apa adanya
app.use(express.text({ type: ['text/plain', '*/plain'], limit: '1mb' }));

// route POST /iclock/cdata
app.post('/iclock/cdata', async (req, res) => {
  const query = req.query;     // SN, table, Stamp
  const headers = req.headers; // semua header
  const body = req.body;       // raw text body

  console.log('--- Request Diterima ---');
  console.log('Query:', JSON.stringify(query));
  console.log('Headers:', JSON.stringify(headers));
  console.log('Body:', JSON.stringify(body));

  // parsing: pisah baris & tab
  const rows = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parsed = rows.map(line => line.split('\t'));
  console.log('Parsed:', JSON.stringify(parsed));

  // const ipBe = 'https://be.smart-bookingpontianak.com' // ganti sesuai kebutuhan
  const ipBe = 'https://staging.be.cip.onet.my.id' // ganti sesuai kebutuhan

  try {
  const targetUrl = `${ipBe}/i-button-reader/amt-in/` + parsed[0][0];
  
  console.log('--- Forwarding Request ---');
  console.log('URL:', targetUrl);

  const forwardRes = await axios.get(targetUrl);

  console.log('--- Forward Response ---');
  console.log('Status:', forwardRes.status);
  console.log('Data:', JSON.stringify(forwardRes.data));
  console.log('Path:', forwardRes.request.path);
} catch (err) {
  console.error('Error forwarding:', err.message);

  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Data:', JSON.stringify(err.response.data));
  }
}

  // tetap balas OK ke mesin absen
  res.send('OK');
});

// jalankan server
const PORT = 8081;
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});