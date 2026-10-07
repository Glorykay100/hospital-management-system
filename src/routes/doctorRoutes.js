// src/routes/doctorRoutes.js
'use strict';

const { Router } = require('express');
const { listDoctors, getDoctor, createDoctor, updateDoctor, deleteDoctor } = require('../controllers/doctorController');
const { doctorCreateRules, doctorUpdateRules } = require('../validators/doctorValidator');
const validate = require('../middleware/validate');

const router = Router();

router.get('/',       listDoctors);
router.get('/:id',    getDoctor);
router.post('/',      doctorCreateRules, validate, createDoctor);
router.put('/:id',    doctorUpdateRules, validate, updateDoctor);
router.delete('/:id', deleteDoctor);

module.exports = router;
