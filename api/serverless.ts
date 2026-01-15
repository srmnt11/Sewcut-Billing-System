/**
 * Vercel Serverless Function Handler
 * This file adapts the Express app to work with Vercel's serverless environment
 */

import { createApp } from '../src/api/index.js';
import { connectDatabase } from '../src/api/config/database.js';

// Initialize database connection (with connection pooling for serverless)
let isConnected = false;

async function ensureDbConnection() {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
}

// Create the Express app
const app = createApp();

// Export the handler for Vercel
export default async function handler(req: any, res: any) {
  try {
    // Ensure database is connected
    await ensureDbConnection();
    
    // Pass the request to Express
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
