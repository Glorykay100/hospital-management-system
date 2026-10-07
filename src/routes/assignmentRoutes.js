// src/routes/assignmentRoutes.js
'use strict';

const { Router } = require('express');
const {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { assignmentCreateRules, assignmentUpdateRules } = require('../validators/assignmentValidator');
const validate = require('../middleware/validate');

const router = Router();

router.get('/',       listAssignments);
router.get('/:id',    getAssignment);
router.post('/',      assignmentCreateRules, validate, createAssignment);
router.put('/:id',    assignmentUpdateRules, validate, updateAssignment);
router.delete('/:id', deleteAssignment);

module.exports = router;
