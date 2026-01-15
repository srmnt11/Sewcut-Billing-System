/**
 * Railway API Entry Point
 * Express server for production deployment on Railway
 */

import { startServer } from './src/api/index.js';

// Start the server on Railway's provided port or default to 3001
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting Railway server...');
startServer(PORT);
