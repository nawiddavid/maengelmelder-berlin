import * as reportRepo from '../repositories/report.repository.js';
import { log } from '../logger.js';

/**
 * Rate Limiting Middleware für Meldungen
 * Limit: 5 Meldungen pro Gerät pro Stunde
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 Stunde
const MAX_REPORTS = process.env.NODE_ENV === 'development' ? 100 : 5;

/**
 * Rate-Limiter für Report-Erstellung
 */
export async function reportRateLimiter(req, res, next) {
  try {
    const deviceId = req.body.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({
        error: 'missing_device_id',
        message: 'deviceId ist erforderlich'
      });
    }
    
    const count = await reportRepo.countByDeviceInWindow(deviceId, WINDOW_MS);
    
    if (count >= MAX_REPORTS) {
      log('rate-limit', `Device ${deviceId} exceeded limit (${count}/${MAX_REPORTS})`);
      
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Zu viele Meldungen. Bitte warten Sie eine Stunde.',
        retryAfter: Math.ceil(WINDOW_MS / 1000)
      });
    }
    
    // Verbleibende Meldungen in Header setzen
    res.setHeader('X-RateLimit-Limit', MAX_REPORTS);
    res.setHeader('X-RateLimit-Remaining', MAX_REPORTS - count - 1);
    res.setHeader('X-RateLimit-Reset', Date.now() + WINDOW_MS);
    
    next();
  } catch (error) {
    log('error', `Rate limiter error: ${error.message}`);
    // Bei Fehler: durchlassen (fail-open)
    next();
  }
}

/**
 * Einfacher IP-basierter Rate-Limiter (Fallback)
 */
const ipCounts = new Map();

export function simpleRateLimiter(maxRequests = 30, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Alte Einträge bereinigen
    if (Math.random() < 0.01) {
      for (const [key, data] of ipCounts) {
        if (now - data.start > windowMs) {
          ipCounts.delete(key);
        }
      }
    }
    
    const current = ipCounts.get(ip) || { count: 0, start: now };
    
    if (now - current.start > windowMs) {
      current.count = 0;
      current.start = now;
    }
    
    current.count++;
    ipCounts.set(ip, current);
    
    if (current.count > maxRequests) {
      return res.status(429).json({
        error: 'too_many_requests',
        message: 'Zu viele Anfragen. Bitte warten Sie.'
      });
    }
    
    next();
  };
}
