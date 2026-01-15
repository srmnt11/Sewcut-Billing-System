/**
 * Vercel Serverless Function Handler
 * Wraps Express app for Vercel's serverless environment
 */

import serverless from 'serverless-http';
import { createApp } from '../src/api/index.js';
import { connectDatabase } from '../src/api/config/database.js';

// Cached database connection
let isConnected = false;

// Initialize database connection
async function initDatabase() {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
      console.log('✅ Database connected for serverless function');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }
}

// Create the Express app
const app = createApp();

// Wrap Express app with serverless-http
const handler = serverless(app);

// Export the Vercel handler
export default async function(req: any, res: any) {
  try {
    // Ensure database is connected before handling request
    await initDatabase();
    
    // Handle the request
    return await handler(req, res);
  } catch (error) {
    console.error('Serverless handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server initialization error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
