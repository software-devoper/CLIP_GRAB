/**
 * In-memory sliding-window IP rate limiter
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  for (const [ip, record] of ipMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > oneHourAgo);
    if (record.timestamps.length === 0) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
  totalLimit: number;
}

/**
 * Checks and records an IP request within the specified rate limit window.
 * @param ip Client IP address
 * @param limit Maximum requests per window (default 30 or RATE_LIMIT_PER_MINUTE)
 * @param windowMs Window duration in milliseconds (default 60000 = 1 minute)
 */
export function checkRateLimit(
  ip: string,
  limit = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '30', 10),
  windowMs = 60 * 1000
): RateLimitResult {
  const cleanIp = ip || 'unknown_client';
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = ipMap.get(cleanIp);
  if (!record) {
    record = { timestamps: [] };
    ipMap.set(cleanIp, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTimeMs = Math.max(0, oldestTimestamp + windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
      totalLimit: limit,
    };
  }

  // Record this request
  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);

  return {
    allowed: true,
    remaining,
    resetTimeMs: windowMs,
    totalLimit: limit,
  };
}
