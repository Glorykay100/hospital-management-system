// src/app.js
'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const apiRouter    = require('./routes');
const notFound     = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Global middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static frontend ────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── SPA fallback — serve index.html for all non-API routes ─────────────────
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ── Error handling (must be last) ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
