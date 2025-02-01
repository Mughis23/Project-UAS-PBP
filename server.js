const express = require('express');
const bodyParser = require('body-parser');
const penggunaController = require('./controllers/penggunaController');
const lowonganController = require('./controllers/lowonganController');
const konsultasiKarirController = require('./controllers/konsultasiKarirController');
const pembayaranController = require('./controllers/pembayaranController');
require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

app.use('/api', penggunaController);
app.use('/api', lowonganController);
app.use('/api', konsultasiKarirController);
app.use('/api', pembayaranController);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT} untuk layanan pencarian kerja dan bimbingan karir`);
});

//Kelompok 1