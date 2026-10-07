// src/server.js
'use strict';

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Bind to 0.0.0.0 — required for Render (and Docker) to receive external traffic
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏥 Hospital Management System running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
