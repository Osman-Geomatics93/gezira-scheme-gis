# Data Protection & Security Documentation

## Overview

This document describes the comprehensive security measures implemented to protect your Gezira Scheme sector data from unauthorized scraping, downloading, and data theft.

## ⚠️ Important Notice

**These security measures provide multiple layers of protection, but no system is 100% secure against determined attackers. Always implement proper access controls, authentication, and monitor for suspicious activity.**

---

## Backend Security Measures

### 1. Rate Limiting

**Location**: `backend/src/middleware/rateLimiter.js`

#### General API Rate Limiter
- **Limit**: 100 requests per 15 minutes per IP
- **Applied to**: All API routes
- **Purpose**: Prevents automated scraping and abuse

#### Data Endpoints Rate Limiter
- **Limit**: 30 requests per 15 minutes per IP
- **Applied to**: Data-heavy endpoints (sector listings, queries)
- **Purpose**: Prevents bulk data extraction

#### Authentication Rate Limiter
- **Limit**: 5 attempts per 15 minutes per IP
- **Applied to**: Login/authentication endpoints
- **Purpose**: Prevents brute force attacks

**All rate limit violations are logged to the database for monitoring.**

---

### 2. Scraping Detection & Prevention

**Location**: `backend/src/middleware/dataProtection.js`

#### Request Pattern Detection
- Tracks requests per IP address
- **Threshold**: 10 requests per minute triggers blocking
- **Block Duration**: 15 minutes
- **Action**: IP is temporarily blocked from all API access

#### User Agent Filtering
Blocks requests from common scraping tools:
- wget
- curl (can be adjusted if needed)
- scrapy
- crawler/spider tools
- python-requests
- node-fetch
- Other automated tools

---

### 3. Pagination Limits

**Location**: `backend/src/middleware/dataProtection.js`

- **Maximum records per request**: 100 (reduced from typical 1000)
- **Default limit**: 50 records
- **Enforcement**: Server-side enforcement, ignores client requests for higher limits
- **Logging**: Large limit requests are logged as potential scraping attempts

---

### 4. Data Watermarking

**Location**: `backend/src/middleware/dataProtection.js`

Every API response includes metadata fingerprinting:
```json
{
  "_meta": {
    "requestId": "unique-request-id",
    "timestamp": "2025-10-08T...",
    "fingerprint": "8-char-hash"
  }
}
```

**Purpose**: If data is leaked, you can trace it back to the source request.

---

### 5. Suspicious Activity Logging

**Database Tables**:
- `suspicious_activity` - Logs all security violations
- `blocked_ips` - Tracks temporarily and permanently blocked IPs

**Logged Information**:
- IP address
- Request path and method
- User agent
- Activity type (rate_limit, scraping, bulk_export, auth_attempt)
- Full request data and headers
- Timestamp

**Query Examples**:

```sql
-- View recent suspicious activity
SELECT * FROM suspicious_activity
ORDER BY created_at DESC
LIMIT 50;

-- Count violations by IP
SELECT ip, COUNT(*) as violation_count, array_agg(DISTINCT activity_type) as types
FROM suspicious_activity
GROUP BY ip
ORDER BY violation_count DESC;

-- View currently blocked IPs
SELECT * FROM blocked_ips
WHERE blocked_until > NOW() OR is_permanent = TRUE;
```

---

## Frontend Security Measures

### 6. Data Protection Component

**Location**: `src/components/Security/DataProtection.tsx`

#### Features:
1. **Right-Click Disabled**: Prevents context menu access
2. **DevTools Detection**: Warns when browser developer tools are opened
3. **Keyboard Shortcuts Blocked**:
   - F12 (DevTools)
   - Ctrl+Shift+I (Inspect)
   - Ctrl+Shift+J (Console)
   - Ctrl+U (View Source)
   - Ctrl+S (Save Page)
4. **Optional Features** (can be enabled):
   - Text selection blocking
   - Copy/paste blocking
   - Visual watermark overlay

#### Usage:

The DataProtection component is already wrapped around your main application in `App.tsx`. You can customize it:

```tsx
<DataProtection
  disableRightClick={true}     // Disable right-click
  disableDevTools={true}        // Block dev tools shortcuts
  disableTextSelection={false}  // Set to true to block text selection
  disableCopy={false}           // Set to true to block copy
  showWatermark={false}         // Set to true to show visual watermark
>
  {/* Your app content */}
</DataProtection>
```

---

## Security Best Practices

### For Administrators

1. **Monitor Suspicious Activity**
   ```sql
   -- Daily check for suspicious patterns
   SELECT DATE(created_at) as date,
          COUNT(*) as incidents,
          COUNT(DISTINCT ip) as unique_ips
   FROM suspicious_activity
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Permanent IP Blocking**
   ```sql
   -- Block a malicious IP permanently
   INSERT INTO blocked_ips (ip, reason, blocked_until, is_permanent)
   VALUES ('xxx.xxx.xxx.xxx', 'Repeated scraping attempts', NOW() + INTERVAL '100 years', TRUE);
   ```

3. **Review Rate Limits**
   - Adjust rate limits in `backend/src/middleware/rateLimiter.js` based on your usage patterns
   - Lower limits = better protection but may impact legitimate users

4. **Regular Security Audits**
   - Review `suspicious_activity` table weekly
   - Check for patterns indicating new attack methods
   - Update user-agent blacklist if needed

### For Developers

1. **Never Expose Sensitive Data**
   - Always require authentication for data endpoints
   - Implement role-based access control (already in place)
   - Use HTTPS in production

2. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

3. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Rotate secrets periodically

---

## Configuration Options

### Adjusting Rate Limits

Edit `backend/src/middleware/rateLimiter.js`:

```javascript
// Example: Make limits stricter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // Keep at 15 minutes
  max: 50,                    // Reduce from 100 to 50
  // ... rest of config
});
```

### Adjusting Scraping Detection

Edit `backend/src/middleware/dataProtection.js`:

```javascript
// Example: More aggressive scraping detection
const SUSPICIOUS_REQUEST_THRESHOLD = 5;  // Default is 10
const TRACKING_WINDOW = 60000;            // 1 minute window
```

### Customizing Frontend Protection

Edit `src/App.tsx` to adjust DataProtection settings:

```tsx
<DataProtection
  disableRightClick={true}
  disableDevTools={true}
  disableTextSelection={true}   // Enable text selection blocking
  disableCopy={true}            // Enable copy blocking
  showWatermark={true}          // Show visual watermark
>
```

---

## Testing Security Measures

### Test Rate Limiting

```bash
# Make rapid requests to trigger rate limit
for i in {1..150}; do
  curl http://localhost:5000/api/sectors
  sleep 0.1
done
```

### Test Scraping Detection

```bash
# Use a blocked user agent
curl -A "wget/1.0" http://localhost:5000/api/sectors
```

### Test Pagination Limits

```bash
# Try to request excessive data
curl "http://localhost:5000/api/sectors?limit=10000"
# Server will cap it at 100
```

### Check Logs

```bash
# Backend console will show warnings
# Database logs can be checked:
SELECT * FROM suspicious_activity ORDER BY created_at DESC LIMIT 10;
```

---

## Monitoring & Alerts

### Recommended Monitoring

1. **Set up alerts for**:
   - More than 10 suspicious activity entries per hour
   - New IPs getting blocked
   - Repeated violations from same IP
   - Unusual spike in API requests

2. **Dashboard Queries**:
   ```sql
   -- Top violating IPs (last 24 hours)
   SELECT ip,
          COUNT(*) as violations,
          array_agg(DISTINCT activity_type) as types,
          MAX(created_at) as last_violation
   FROM suspicious_activity
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY ip
   ORDER BY violations DESC
   LIMIT 10;
   ```

---

## Limitations & Considerations

### What These Protections CAN Do:
✅ Deter casual scraping attempts
✅ Block automated tools and bots
✅ Slow down bulk data extraction
✅ Provide audit trail of suspicious activity
✅ Prevent accidental data leaks

### What These Protections CANNOT Do:
❌ Stop determined attackers with proxies/VPNs
❌ Prevent screenshot-based data theft
❌ Block users who slowly extract data over time
❌ Protect against insider threats

### Additional Recommendations:

1. **Legal Protection**: Add Terms of Service and Data Usage agreements
2. **Access Control**: Only give access to users who need it
3. **Data Minimization**: Only expose necessary fields in API responses
4. **Regular Backups**: Maintain encrypted backups
5. **Network Security**: Use firewall, VPN, and network monitoring
6. **HTTPS Only**: Always use TLS/SSL in production

---

## Support & Maintenance

### Files Modified/Created:

**Backend**:
- `backend/src/middleware/rateLimiter.js` - Rate limiting with database logging
- `backend/src/middleware/dataProtection.js` - Scraping detection and prevention
- `backend/migrations/004_suspicious_activity_table.sql` - Security tables
- `backend/src/server.js` - Applied security middleware

**Frontend**:
- `src/hooks/useDataProtection.ts` - Data protection React hook
- `src/components/Security/DataProtection.tsx` - Protection component
- `src/App.tsx` - Applied data protection wrapper

**Documentation**:
- `DATA_PROTECTION_SECURITY.md` - This file

### Maintenance Tasks:

- **Weekly**: Review suspicious_activity logs
- **Monthly**: Update user-agent blacklist if needed
- **Quarterly**: Review and adjust rate limits
- **Yearly**: Security audit and penetration testing

---

## Questions or Issues?

If you need to adjust any security settings or have questions about the implementation, refer to the specific files mentioned above or consult with a security professional for advanced configurations.

**Remember**: Security is an ongoing process, not a one-time setup. Stay vigilant and keep your system updated!
