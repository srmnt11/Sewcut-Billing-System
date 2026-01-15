/**
 * Vercel Serverless Function Handler
 * Wraps Express app for Vercel's serverless environment
 */

const serverless = require('serverless-http');

// Import using dynamic import since we're using ESM
let app;
let isConnected = false;

async function getApp() {
  if (!app) {
    const { createApp } = await import('../src/api/index.js');
    const { connectDatabase } = await import('../src/api/config/database.js');
    
    // Connect to database
    if (!isConnected) {
      await connectDatabase();
      isConnected = true;
      console.log('✅ Database connected');
    }
    
    app = createApp();
  }
  return app;
}

// Vercel handler
module.exports = async (req, res) => {
  try {
    const application = await getApp();
    const handler = serverless(application);
    return await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
