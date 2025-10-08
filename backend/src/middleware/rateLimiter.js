import rateLimit from 'express-rate-limit';
import pool from '../config/database.js';

// Helper function to log suspicious activity to database
async function logSuspiciousActivity(req, activityType, reason) {
  const activity = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
    headers: req.headers
  };

  console.error(`🚨 ${activityType.toUpperCase()} ACTIVITY DETECTED:`, JSON.stringify(activity, null, 2));

  try {
    // Log to database
    await pool.query(
      `INSERT INTO suspicious_activity (ip, path, method, user_agent, activity_type, reason, request_data, headers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.ip,
        req.path,
        req.method,
        req.get('user-agent'),
        activityType,
        reason,
        JSON.stringify({ query: req.query, body: req.body }),
        JSON.stringify(req.headers)
      ]
    );
  } catch (error) {
    console.error('Failed to log suspicious activity to database:', error.message);
    // Don't throw error - logging failure shouldn't break the application
  }
}

// General API rate limiter - 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: async (req, res) => {
    console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip} - Path: ${req.path}`);

    await logSuspiciousActivity(req, 'rate_limit', `General rate limit exceeded: ${req.rateLimit.current} requests`);

    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Strict limiter for data-heavy endpoints - 30 requests per 15 minutes
export const dataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many data requests from this IP. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res) => {
    console.warn(`⚠️  Data rate limit exceeded for IP: ${req.ip} - Path: ${req.path}`);

    await logSuspiciousActivity(req, 'data_scraping', `Data rate limit exceeded: ${req.rateLimit.current} requests`);

    res.status(429).json({
      success: false,
      message: 'Too many data requests. Your activity has been logged.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Very strict limiter for authentication endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  handler: async (req, res) => {
    console.error(`🚨 Auth rate limit exceeded for IP: ${req.ip} - Possible brute force attack`);

    await logSuspiciousActivity(req, 'auth_attempt', `Brute force auth attempt: ${req.rateLimit.current} login attempts`);

    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Account temporarily locked.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
