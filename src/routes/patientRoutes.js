// src/routes/patientRoutes.js
'use strict';

const { Router } = require('express');
const { listPatients, getPatient, createPatient, updatePatient, deletePatient } = require('../controllers/patientController');
const { patientCreateRules, patientUpdateRules } = require('../validators/patientValidator');
const validate = require('../middleware/validate');

const router = Router();

router.get('/',       listPatients);
router.get('/:id',    getPatient);
router.post('/',      patientCreateRules, validate, createPatient);
router.put('/:id',    patientUpdateRules, validate, updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
