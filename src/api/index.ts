/**
 * API Entry Point
 * Express server configuration with MongoDB connection
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import billingRoutes from './routes/billing.routes.js';
import draftRoutes from './routes/draft.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import emailTestRoutes from './routes/email.test.routes.js';
import { serverConfig } from '../config/index.js';
import { connectDatabase } from './config/database.js';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors({
    origin: serverConfig.corsOrigin,
    credentials: true
  })); // Enable CORS with configuration
  app.use(express.json()); // Parse JSON request bodies
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

  // Request logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/billings', billingRoutes);
  app.use('/api/drafts', draftRoutes);
  app.use('/api', emailTestRoutes); // Email test routes

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path
    });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: serverConfig.nodeEnv === 'development' ? err.message : undefined
    });
  });

  return app;
}

/**
 * Start the server
 * Connects to MongoDB before starting the Express server
 */
export async function startServer(port?: number): Promise<void> {
  try {
    // Connect to MongoDB first
    await connectDatabase();
    
    // Then start the Express server
    const app = createApp();
    const serverPort = port || serverConfig.port;

    app.listen(serverPort, () => {
      console.log(`🚀 Sewcut Billing API Server running on port ${serverPort}`);
      console.log(`📍 Environment: ${serverConfig.nodeEnv}`);
      console.log(`📍 Health check: http://localhost:${serverPort}/health`);
      console.log(`📍 API endpoint: http://localhost:${serverPort}/api/billings`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (process.argv[1] === __filename) {
  startServer();
}
