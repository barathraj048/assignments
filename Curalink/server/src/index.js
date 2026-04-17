// server/src/index.js
require('express-async-errors');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Health check — test this first
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Curalink running' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server on port ${PORT}`)
  );
});