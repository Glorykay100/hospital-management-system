// src/middleware/validate.js
'use strict';

const { validationResult } = require('express-validator');

/**
 * Collects express-validator errors and short-circuits with 400 if any exist.
 * Place this AFTER the validator chain in a route definition.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path ?? e.param,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = validate;
