// src/validators/wardValidator.js
'use strict';

const { body } = require('express-validator');

const WARD_TYPES = ['General', 'ICU', 'Maternity', 'Pediatric'];

const wardCreateRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ward name is required.')
    .isLength({ max: 80 }).withMessage('Ward name must be 80 characters or fewer.'),

  body('wardType')
    .notEmpty().withMessage('Ward type is required.')
    .isIn(WARD_TYPES).withMessage(`Ward type must be one of: ${WARD_TYPES.join(', ')}.`),

  body('capacity')
    .notEmpty().withMessage('Capacity is required.')
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer.'),

  body('currentOccupancy')
    .optional()
    .isInt({ min: 0 }).withMessage('Current occupancy must be a non-negative integer.')
    .custom((value, { req }) => {
      const capacity = parseInt(req.body.capacity, 10);
      if (!isNaN(capacity) && parseInt(value, 10) > capacity) {
        throw new Error('Current occupancy cannot exceed capacity.');
      }
      return true;
    }),
];

const wardUpdateRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Ward name cannot be empty.')
    .isLength({ max: 80 }).withMessage('Ward name must be 80 characters or fewer.'),

  body('wardType')
    .optional()
    .isIn(WARD_TYPES).withMessage(`Ward type must be one of: ${WARD_TYPES.join(', ')}.`),

  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer.'),

  body('currentOccupancy')
    .optional()
    .isInt({ min: 0 }).withMessage('Current occupancy must be a non-negative integer.'),
];

module.exports = { wardCreateRules, wardUpdateRules };
