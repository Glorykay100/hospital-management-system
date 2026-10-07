// src/validators/assignmentValidator.js
'use strict';

const { body } = require('express-validator');

const STATUSES = ['active', 'discharged', 'transferred'];

const assignmentCreateRules = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required.')
    .isInt({ min: 1 }).withMessage('Patient ID must be a positive integer.')
    .toInt(),

  body('wardId')
    .notEmpty().withMessage('Ward ID is required.')
    .isInt({ min: 1 }).withMessage('Ward ID must be a positive integer.')
    .toInt(),

  body('doctorId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer.')
    .toInt(),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or fewer.'),
];

const assignmentUpdateRules = [
  body('status')
    .optional()
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),

  body('doctorId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer.')
    .toInt(),

  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be 1000 characters or fewer.'),
];

module.exports = { assignmentCreateRules, assignmentUpdateRules };
