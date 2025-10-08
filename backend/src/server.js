import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import sectorsRoutes from './routes/sectorsRoutes.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { detectScraping, preventBulkExport, addWatermark } from './middleware/dataProtection.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware (applied first)
app.use(helmet()); // Security headers
app.use(detectScraping); // Detect and block scraping attempts
app.use(preventBulkExport); // Block automated tools
app.use(generalLimiter); // Apply rate limiting to all routes

// Logging
app.use(morgan('dev')); // HTTP logging

// Body parsing
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb for security
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - allow all localhost ports for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost port in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // In production, use FRONTEND_URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes); // Extra rate limiting for auth
app.use('/api/sectors', addWatermark, sectorsRoutes); // Add watermark to sector data

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gezira Scheme API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      sectors: '/api/sectors'
    },
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (protected)',
        updateProfile: 'PUT /api/auth/profile (protected)',
        changePassword: 'POST /api/auth/change-password (protected)',
        logout: 'POST /api/auth/logout (protected)'
      },
      sectors: {
        getAll: 'GET /api/sectors?division=&search=&minArea=&maxArea=&office=&limit=&offset= (protected)',
        getById: 'GET /api/sectors/:id (protected)',
        getByDivision: 'GET /api/sectors/division/:division (protected)',
        getHistory: 'GET /api/sectors/:id/history (protected)',
        create: 'POST /api/sectors (admin/editor)',
        update: 'PUT /api/sectors/:id (admin/editor)',
        batchUpdate: 'POST /api/sectors/batch-update (admin/editor)',
        delete: 'DELETE /api/sectors/:id (admin)'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Database connection test
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Verify PostGIS extension
    const result = await client.query('SELECT PostGIS_Version()');
    console.log('✅ PostGIS version:', result.rows[0].postgis_version);

    client.release();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'gezira_scheme'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`\n📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Make sure PostgreSQL is running and .env is configured correctly');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

export default app;
