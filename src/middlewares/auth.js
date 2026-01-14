import * as adminRepo from '../repositories/admin.repository.js';
import { log } from '../logger.js';

/**
 * Authentifizierungs-Middleware für Admin-Bereich
 */

/**
 * Prüft ob Nutzer eingeloggt ist
 */
export function requireAuth(req, res, next) {
  if (!req.session?.adminId) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Bitte melden Sie sich an'
    });
  }
  next();
}

/**
 * Lädt Admin-Daten in Request
 */
export async function loadAdmin(req, res, next) {
  if (req.session?.adminId) {
    try {
      const admin = await adminRepo.findById(req.session.adminId);
      if (admin) {
        req.admin = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        };
      } else {
        // Admin existiert nicht mehr - Session invalidieren
        req.session.destroy();
      }
    } catch (error) {
      log('error', `Failed to load admin: ${error.message}`);
    }
  }
  next();
}

/**
 * Prüft ob Nutzer Admin-Rolle hat
 */
export function requireAdminRole(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Bitte melden Sie sich an'
    });
  }
  
  if (req.admin.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Sie haben keine Berechtigung für diese Aktion'
    });
  }
  
  next();
}

/**
 * Prüft ob Nutzer mindestens Viewer ist
 */
export function requireViewerRole(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Bitte melden Sie sich an'
    });
  }
  
  // Viewer und Admin haben beide Lesezugriff
  if (!['ADMIN', 'VIEWER'].includes(req.admin.role)) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Sie haben keine Berechtigung für diese Aktion'
    });
  }
  
  next();
}
