/**
 * Vercel Serverless Function Handler
 * This file adapts the Express app to work with Vercel's serverless environment
 */

import { createApp } from '../src/api/index.js';

// Create the Express app once
const app = createApp();

// Export the handler for Vercel
export default app;
