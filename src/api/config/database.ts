/**
 * MongoDB Database Connection Module
 * 
 * Handles connection to MongoDB using Mongoose.
 * Provides connection, disconnection, and status checking utilities.
 */

import mongoose from 'mongoose';
import { databaseConfig } from '../../config/index.js';

/**
 * Connect to MongoDB database
 * 
 * @returns Promise<void>
 */
export async function connectDatabase(): Promise<void> {
  try {
    const uri = databaseConfig.uri;
    
    if (!uri) {
      throw new Error('MongoDB URI is not configured. Please set MONGODB_URI in your .env file.');
    }

    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(uri);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    
    // Set up connection event handlers
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB database
 * 
 * @returns Promise<void>
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Check if database is connected
 * 
 * @returns boolean
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1; // 1 = connected
}

/**
 * Get database connection status
 * 
 * @returns string - 'disconnected' | 'connected' | 'connecting' | 'disconnecting'
 */
export function getDatabaseStatus(): string {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}
