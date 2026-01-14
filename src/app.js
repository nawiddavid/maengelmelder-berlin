import express from 'express';
import session from 'express-session';
import { log } from './logger.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { loadAdmin } from './middlewares/auth.js';
import { helloRouter } from './routes/hello.route.js';
import { messagesRouter } from './routes/messages.route.js';
import { reportsRouter } from './routes/reports.route.js';
import { adminRouter } from './routes/admin.route.js';
import { authRouter } from './routes/auth.route.js';
import * as routingService from './services/routing.service.js';

const app = express();

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session für Admin-Authentifizierung
app.use(session({
  secret: process.env.SESSION_SECRET || 'maengelmelder-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

// Admin laden (falls eingeloggt)
app.use(loadAdmin);

// Statische Dateien
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
  log('route', 'health-check');
  res.json({ data: 'ok' });
});

// Bestehende Routes
app.use('/api/hello', helloRouter);
app.use('/api/messages', messagesRouter);

// Mängelmelder Routes
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);

// 404 und Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

// Initialisierung: Default Routing-Regeln erstellen
routingService.seedDefaultRules().catch(err => {
  log('error', `Failed to seed routing rules: ${err.message}`);
});

export default app;

