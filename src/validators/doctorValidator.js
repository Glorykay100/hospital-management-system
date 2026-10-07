// src/validators/doctorValidator.js
'use strict';

const { body } = require('express-validator');

const doctorCreateRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ max: 120 }).withMessage('Full name must be 120 characters or fewer.'),

  body('specialization')
    .trim()
    .notEmpty().withMessage('Specialization is required.')
    .isLength({ max: 80 }).withMessage('Specialization must be 80 characters or fewer.'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email must be a valid email address.')
    .isLength({ max: 150 }).withMessage('Email must be 150 characters or fewer.'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone must be 20 characters or fewer.'),
];

const doctorUpdateRules = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty.')
    .isLength({ max: 120 }).withMessage('Full name must be 120 characters or fewer.'),

  body('specialization')
    .optional()
    .trim()
    .notEmpty().withMessage('Specialization cannot be empty.')
    .isLength({ max: 80 }).withMessage('Specialization must be 80 characters or fewer.'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('Email must be a valid email address.')
    .isLength({ max: 150 }).withMessage('Email must be 150 characters or fewer.'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Phone must be 20 characters or fewer.'),
];

module.exports = { doctorCreateRules, doctorUpdateRules };
