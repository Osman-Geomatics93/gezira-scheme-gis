-- Create table for tracking suspicious activity and scraping attempts
CREATE TABLE IF NOT EXISTS suspicious_activity (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  path VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  user_agent TEXT,
  activity_type VARCHAR(50) NOT NULL, -- 'rate_limit', 'scraping', 'bulk_export', 'auth_attempt'
  reason TEXT,
  request_data JSONB,
  headers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for suspicious_activity table
CREATE INDEX IF NOT EXISTS idx_suspicious_ip ON suspicious_activity(ip);
CREATE INDEX IF NOT EXISTS idx_suspicious_created_at ON suspicious_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_type ON suspicious_activity(activity_type);

-- Create table for IP blocking
CREATE TABLE IF NOT EXISTS blocked_ips (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(45) UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_permanent BOOLEAN DEFAULT FALSE,
  attempts_count INTEGER DEFAULT 1
);

-- Create indexes for blocked_ips table
CREATE INDEX IF NOT EXISTS idx_blocked_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_blocked_until ON blocked_ips(blocked_until);

-- Create function to auto-unblock expired IPs
CREATE OR REPLACE FUNCTION cleanup_expired_blocks()
RETURNS void AS $$
BEGIN
  DELETE FROM blocked_ips
  WHERE blocked_until < NOW()
  AND is_permanent = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-blocks', '*/5 * * * *', 'SELECT cleanup_expired_blocks()');

COMMENT ON TABLE suspicious_activity IS 'Logs all suspicious activity including scraping attempts, rate limit violations, and unauthorized access';
COMMENT ON TABLE blocked_ips IS 'Tracks blocked IP addresses and their block duration';
