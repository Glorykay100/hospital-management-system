// src/validators/patientValidator.js
'use strict';

const { body } = require('express-validator');

const GENDERS = ['male', 'female', 'other'];

const patientCreateRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ max: 120 }).withMessage('Full name must be 120 characters or fewer.'),

  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required.')
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD).')
    .custom((value) => {
      if (new Date(value) >= new Date()) throw new Error('Date of birth cannot be in the future.');
      return true;
    }),

  body('gender')
    .notEmpty().withMessage('Gender is required.')
    .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}.`),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone must be 20 characters or fewer.'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email must be a valid email address.')
    .isLength({ max: 150 }).withMessage('Email must be 150 characters or fewer.'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
];

const patientUpdateRules = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty.')
    .isLength({ max: 120 }).withMessage('Full name must be 120 characters or fewer.'),

  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD).')
    .custom((value) => {
      if (new Date(value) >= new Date()) throw new Error('Date of birth cannot be in the future.');
      return true;
    }),

  body('gender')
    .optional()
    .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}.`),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone must be 20 characters or fewer.'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email must be a valid email address.')
    .isLength({ max: 150 }).withMessage('Email must be 150 characters or fewer.'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
];

module.exports = { patientCreateRules, patientUpdateRules };
