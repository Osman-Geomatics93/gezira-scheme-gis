// Middleware to prevent bulk data extraction and scraping
import crypto from 'crypto';
import pool from '../config/database.js';

// Maximum allowed records per request
const MAX_LIMIT = 100; // Reduced from 1000 to prevent bulk downloads
const DEFAULT_LIMIT = 50;

// Track request patterns to detect scraping
const requestTracking = new Map();
const TRACKING_WINDOW = 60000; // 1 minute
const SUSPICIOUS_REQUEST_THRESHOLD = 20; // More than 20 requests per minute is suspicious (increased for development)

// Whitelist for development - localhost IPs
const WHITELISTED_IPS = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];

// Middleware to limit pagination
export const limitPagination = (req, res, next) => {
  // Override limit if it's too high
  if (req.query.limit) {
    const requestedLimit = parseInt(req.query.limit);

    if (requestedLimit > MAX_LIMIT) {
      console.warn(`⚠️  Large limit requested: ${requestedLimit} from IP: ${req.ip}`);

      // Force the limit to maximum allowed
      req.query.limit = MAX_LIMIT;

      // Log potential scraping attempt
      logScrapingAttempt(req, `Requested limit: ${requestedLimit}`).catch(err =>
        console.error('Failed to log scraping attempt:', err)
      );
    }
  } else {
    // Set default limit if not specified
    req.query.limit = DEFAULT_LIMIT;
  }

  next();
};

// Middleware to track and detect scraping patterns
export const detectScraping = async (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  // Skip detection for whitelisted IPs (development)
  if (WHITELISTED_IPS.includes(ip)) {
    return next();
  }

  // Get or initialize tracking for this IP
  if (!requestTracking.has(ip)) {
    requestTracking.set(ip, {
      requests: [],
      blocked: false,
      blockUntil: null
    });
  }

  const tracking = requestTracking.get(ip);

  // Check if IP is currently blocked
  if (tracking.blocked && tracking.blockUntil > now) {
    const remainingTime = Math.ceil((tracking.blockUntil - now) / 1000);
    console.error(`🚨 Blocked IP attempted access: ${ip}`);

    return res.status(403).json({
      success: false,
      message: 'Access temporarily blocked due to suspicious activity',
      blockedFor: `${remainingTime} seconds`,
      contact: 'Please contact administrator if you believe this is an error'
    });
  }

  // Reset block if time has passed
  if (tracking.blocked && tracking.blockUntil <= now) {
    tracking.blocked = false;
    tracking.blockUntil = null;
  }

  // Remove old requests outside tracking window
  tracking.requests = tracking.requests.filter(time => now - time < TRACKING_WINDOW);

  // Add current request
  tracking.requests.push(now);

  // Check for suspicious pattern
  if (tracking.requests.length > SUSPICIOUS_REQUEST_THRESHOLD) {
    console.error(`🚨 SCRAPING DETECTED from IP: ${ip} - ${tracking.requests.length} requests in 1 minute`);

    // Block the IP for 15 minutes
    tracking.blocked = true;
    tracking.blockUntil = now + (15 * 60 * 1000); // 15 minutes

    await logScrapingAttempt(req, `${tracking.requests.length} requests in 1 minute`);

    return res.status(403).json({
      success: false,
      message: 'Suspicious activity detected. Access blocked for 15 minutes.',
      reason: 'Too many rapid requests',
      contact: 'Please contact administrator if you believe this is an error'
    });
  }

  next();
};

// Middleware to prevent unauthorized bulk exports
export const preventBulkExport = async (req, res, next) => {
  // Check for common scraping patterns in user agent
  const userAgent = req.get('user-agent') || '';
  const scrapingPatterns = [
    /wget/i,
    /curl/i,
    /scrapy/i,
    /crawler/i,
    /bot/i,
    /spider/i,
    /scraper/i,
    /python-requests/i,
    /node-fetch/i
  ];

  const isSuspicious = scrapingPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    console.error(`🚨 Suspicious user agent detected: ${userAgent} from IP: ${req.ip}`);
    await logScrapingAttempt(req, `Suspicious user agent: ${userAgent}`);

    return res.status(403).json({
      success: false,
      message: 'Access denied. Automated tools are not permitted.',
      userAgent: userAgent
    });
  }

  next();
};

// Middleware to add watermarks to sensitive data (optional - can track leaked data)
export const addWatermark = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to add watermark
  res.json = function(data) {
    if (data && data.success && data.data) {
      // Add invisible watermark with request metadata
      data._meta = {
        requestId: generateRequestId(req),
        timestamp: new Date().toISOString(),
        // This can help track if data is leaked
        fingerprint: generateFingerprint(req)
      };
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

// Helper function to log scraping attempts
async function logScrapingAttempt(req, reason) {
  const attempt = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
    query: req.query,
    reason: reason,
    headers: req.headers
  };

  console.error('🚨 SCRAPING ATTEMPT DETECTED:', JSON.stringify(attempt, null, 2));

  try {
    // Store in database
    await pool.query(
      `INSERT INTO suspicious_activity (ip, path, method, user_agent, activity_type, reason, request_data, headers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.ip,
        req.path,
        req.method,
        req.get('user-agent'),
        'scraping',
        reason,
        JSON.stringify({ query: req.query }),
        JSON.stringify(req.headers)
      ]
    );
  } catch (error) {
    console.error('Failed to log scraping attempt to database:', error.message);
  }
}

// Generate unique request ID
function generateRequestId(req) {
  return `${req.ip}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate fingerprint for tracking
function generateFingerprint(req) {
  const data = `${req.ip}${req.get('user-agent')}${Date.now()}`;
  return crypto.createHash('md5').update(data).digest('hex').substr(0, 8);
}

// Clean up old tracking data periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracking] of requestTracking.entries()) {
    // Remove tracking for IPs with no recent requests
    if (tracking.requests.length === 0 && !tracking.blocked) {
      requestTracking.delete(ip);
    }
    // Reset unblocked IPs
    if (tracking.blocked && tracking.blockUntil <= now) {
      tracking.blocked = false;
      tracking.blockUntil = null;
      tracking.requests = [];
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
