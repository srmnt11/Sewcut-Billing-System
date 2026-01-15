/**
 * Vercel Serverless Function Handler
 * This file adapts the Express app to work with Vercel's serverless environment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/api/index.js';
import { connectDatabase } from '../src/api/config/database.js';

// Create the Express app
const app = createApp();

// Cached database connection
let isConnected = false;

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect to database if not already connected
    if (!isConnected) {
      await connectDatabase();
      isConnected = true;
    }

    // Handle the request with Express
    app(req as any, res as any);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
