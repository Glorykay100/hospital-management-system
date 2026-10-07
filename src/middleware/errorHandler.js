// src/middleware/errorHandler.js
'use strict';

const ApiError = require('../utils/ApiError');

// Map Prisma error codes to HTTP status codes
const PRISMA_ERROR_MAP = {
  P2002: { status: 409, message: 'A record with that value already exists.' },
  P2003: { status: 409, message: 'Related record does not exist.' },
  P2014: { status: 409, message: 'Relation violation.' },
  P2025: { status: 404, message: 'Record not found.' },
};

/**
 * Central error handler — must be registered LAST in Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';

  // ── Prisma known errors ────────────────────────────────────────────────────
  if (err.code && PRISMA_ERROR_MAP[err.code]) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      ...(err.meta && !isProd ? { meta: err.meta } : {}),
    });
  }

  // ── Operational errors (ApiError) ─────────────────────────────────────────
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ── Unexpected / programming errors ───────────────────────────────────────
  console.error('[UnhandledError]', err);
  return res.status(500).json({
    success: false,
    message: isProd ? 'An unexpected error occurred.' : err.message,
    ...(!isProd ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
