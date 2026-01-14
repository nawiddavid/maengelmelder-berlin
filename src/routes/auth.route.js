import { Router } from 'express';
import bcrypt from 'bcrypt';
import * as adminRepo from '../repositories/admin.repository.js';
import { requireAuth } from '../middlewares/auth.js';
import { log } from '../logger.js';

const router = Router();

/**
 * POST /api/auth/login
 * Admin-Login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'E-Mail und Passwort sind erforderlich'
      });
    }

    const admin = await adminRepo.findByEmail(email.toLowerCase());

    if (!admin) {
      log('auth', `Login failed: unknown email ${email}`);
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Ungültige Anmeldedaten'
      });
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordValid) {
      log('auth', `Login failed: wrong password for ${email}`);
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Session erstellen
    req.session.adminId = admin.id;

    // Letzten Login aktualisieren
    await adminRepo.updateLastLogin(admin.id);

    log('auth', `Login successful: ${email}`);

    res.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Admin-Logout
 */
router.post('/logout', (req, res) => {
  const email = req.session?.adminId;
  
  req.session.destroy((err) => {
    if (err) {
      log('error', `Logout error: ${err.message}`);
    }
    
    res.clearCookie('connect.sid');
    
    if (email) {
      log('auth', `Logout: ${email}`);
    }
    
    res.json({ success: true });
  });
});

/**
 * GET /api/auth/me
 * Aktuellen Admin abrufen
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const admin = await adminRepo.findById(req.session.adminId);

    if (!admin) {
      req.session.destroy();
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Session ungültig'
      });
    }

    res.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/debug
 * Debug-Informationen (nur für Diagnose)
 */
router.get('/debug', async (req, res, next) => {
  try {
    const admins = await adminRepo.findAll();
    
    res.json({
      database: 'connected',
      adminCount: admins.length,
      admins: admins.map(a => ({ email: a.email, role: a.role })),
      session: {
        adminId: req.session?.adminId || null
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
        COOKIE_SECURE: process.env.COOKIE_SECURE || 'not set'
      }
    });
  } catch (error) {
    res.json({
      database: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/seed-admin
 * Erstellt Admin falls keiner existiert (für Deployment)
 */
router.get('/seed-admin', async (req, res, next) => {
  try {
    const admins = await adminRepo.findAll();
    
    if (admins.length > 0) {
      return res.json({
        success: false,
        message: `${admins.length} Admin(s) existieren bereits`,
        admins: admins.map(a => a.email)
      });
    }
    
    // Default Admin erstellen
    const defaultPassword = 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    const admin = await adminRepo.createAdmin({
      email: 'admin@maengelmelder.de',
      passwordHash,
      name: 'Administrator',
      role: 'ADMIN'
    });
    
    log('auth', 'Default admin seeded via endpoint');
    
    res.json({
      success: true,
      message: 'Admin erstellt',
      email: admin.email,
      password: defaultPassword
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auth/setup
 * Initialer Admin-Setup (nur wenn noch kein Admin existiert)
 */
router.post('/setup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Prüfen ob bereits Admins existieren
    const admins = await adminRepo.findAll();
    if (admins.length > 0) {
      return res.status(400).json({
        error: 'setup_complete',
        message: 'Setup wurde bereits durchgeführt'
      });
    }

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'E-Mail, Passwort und Name sind erforderlich'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Passwort muss mindestens 8 Zeichen haben'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const admin = await adminRepo.createAdmin({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'ADMIN'
    });

    log('auth', `Initial admin created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Admin erfolgreich erstellt',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
