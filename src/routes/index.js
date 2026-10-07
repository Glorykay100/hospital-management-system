// src/routes/index.js
'use strict';

const { Router } = require('express');
const patientRoutes    = require('./patientRoutes');
const wardRoutes       = require('./wardRoutes');
const doctorRoutes     = require('./doctorRoutes');
const assignmentRoutes = require('./assignmentRoutes');

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// Resource routes
router.use('/patients',    patientRoutes);
router.use('/wards',       wardRoutes);
router.use('/doctors',     doctorRoutes);
router.use('/assignments', assignmentRoutes);

module.exports = router;
