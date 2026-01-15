/**
 * Configuration Module
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Configuration interface
 */
interface Config {
  // Server Configuration
  server: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
  };

  // Database Configuration
  database: {
    uri: string;
    name: string;
  };

  // Email Configuration
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
  };

  // File Storage Configuration
  storage: {
    pdfOutputDir: string;
    uploadDir: string;
    maxFileSize: number;
  };

  // Security Configuration
  security: {
    jwtSecret?: string;
  };

  // Logging Configuration
  logging: {
    level: string;
  };
}

/**
 * Validate required environment variables
 */
function validateConfig(): void {
  const required = [
    'PORT',
    'NODE_ENV',
    'MONGODB_URI'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️ Warning: Missing required environment variables: ${missing.join(', ')}`
    );
    console.warn('Some features may not work correctly.');
  }

  // Warn about email configuration if not set
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Warning: Email configuration incomplete. Email features will not work.');
    console.warn('Set SMTP_USER and SMTP_PASS in .env file to enable email functionality.');
  }
}

/**
 * Create configuration object from environment variables
 */
function createConfig(): Config {
  return {
    server: {
      port: parseInt(process.env.PORT || '3001', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
    },

    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sewcut-billing',
      name: process.env.DB_NAME || 'sewcut-billing'
    },

    email: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      fromName: process.env.SMTP_FROM_NAME || 'Sewcut Company'
    },

    storage: {
      pdfOutputDir: process.env.PDF_OUTPUT_DIR 
        ? path.resolve(process.cwd(), process.env.PDF_OUTPUT_DIR)
        : path.resolve(process.cwd(), 'generated-pdfs'),
      uploadDir: process.env.UPLOAD_DIR 
        ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
        : path.resolve(process.cwd(), 'uploads'),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB default
    },

    security: {
      jwtSecret: process.env.JWT_SECRET
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info'
    }
  };
}

// Validate environment variables
validateConfig();

// Export configuration
export const config = createConfig();

// Export individual configs for convenience
export const serverConfig = config.server;
export const databaseConfig = config.database;
export const emailConfig = config.email;
export const storageConfig = config.storage;
export const securityConfig = config.security;
export const loggingConfig = config.logging;

// Development helpers
if (config.server.nodeEnv === 'development') {
  console.log('📝 Configuration loaded:');
  console.log('- Server Port:', config.server.port);
  console.log('- Node Environment:', config.server.nodeEnv);
  console.log('- Database URI:', config.database.uri.replace(/\/\/.*@/, '//*****@')); // Hide credentials
  console.log('- Email Host:', config.email.host);
  console.log('- Email User:', config.email.user ? '✓ Configured' : '✗ Not configured');
  console.log('- PDF Output Dir:', config.storage.pdfOutputDir);
  console.log('- CORS Origin:', config.server.corsOrigin);
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(config.email.user && config.email.pass);
}

/**
 * Check if database is configured
 */
export function isDatabaseConfigured(): boolean {
  return !!config.database.uri;
}

/**
 * Get safe config for client (excludes sensitive data)
 */
export function getSafeConfig() {
  return {
    server: {
      nodeEnv: config.server.nodeEnv
    },
    email: {
      configured: isEmailConfigured()
    },
    database: {
      configured: isDatabaseConfigured()
    }
  };
}
