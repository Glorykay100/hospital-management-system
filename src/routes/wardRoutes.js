// src/routes/wardRoutes.js
'use strict';

const { Router } = require('express');
const { listWards, getWard, createWard, updateWard, deleteWard } = require('../controllers/wardController');
const { wardCreateRules, wardUpdateRules } = require('../validators/wardValidator');
const validate = require('../middleware/validate');

const router = Router();

router.get('/',       listWards);
router.get('/:id',    getWard);
router.post('/',      wardCreateRules, validate, createWard);
router.put('/:id',    wardUpdateRules, validate, updateWard);
router.delete('/:id', deleteWard);

module.exports = router;
