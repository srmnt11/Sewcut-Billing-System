import serverless from 'serverless-http';
import { createApp } from '../src/api/index.js';
import { connectDatabase } from '../src/api/config/database.js';

let isConnected = false;
let app = null;

async function initializeApp() {
  if (!app) {
    if (!isConnected) {
      await connectDatabase();
      isConnected = true;
    }
    app = createApp();
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const application = await initializeApp();
    const wrappedHandler = serverless(application);
    return await wrappedHandler(req, res);
  } catch (error) {
    console.error('Serverless error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
