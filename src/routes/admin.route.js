import { Router } from 'express';
import * as reportService from '../services/report.service.js';
import * as routingService from '../services/routing.service.js';
import { requireAuth, requireAdminRole, requireViewerRole } from '../middlewares/auth.js';
import { validateStatusChange } from '../middlewares/validation.js';
import { log } from '../logger.js';

const router = Router();

// Alle Admin-Routen erfordern Authentifizierung
router.use(requireAuth);

/**
 * GET /api/admin/reports
 * Listet alle Meldungen mit Filtern
 */
router.get('/reports',
  requireViewerRole,
  async (req, res, next) => {
    try {
      const { status, category, district, from, to, page, limit } = req.query;
      
      const result = await reportService.listReports({
        status,
        category,
        district,
        from,
        to,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/reports/:id
 * Meldungsdetails abrufen
 */
router.get('/reports/:id',
  requireViewerRole,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const report = await reportService.getReportDetails(id);
      
      if (!report) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Meldung nicht gefunden'
        });
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/admin/reports/:id
 * Status einer Meldung ändern
 */
router.patch('/reports/:id',
  requireAdminRole,
  validateStatusChange,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      log('admin', `Changing status of ${id} to ${status} by ${req.admin.email}`);
      
      const report = await reportService.changeStatus(id, status, req.admin.id);
      
      res.json(report);
    } catch (error) {
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'not_found',
          message: 'Meldung nicht gefunden'
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/admin/reports/:id/forward
 * Meldung an zuständige Stelle weiterleiten (manuelle Auswahl)
 */
router.post('/reports/:id/forward',
  requireAdminRole,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { authorityKey, authorityName, authorityEmail, comment } = req.body;
      
      if (!authorityName) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Zuständige Stelle muss angegeben werden'
        });
      }
      
      log('admin', `Forwarding ${id} to ${authorityName} by ${req.admin.email}`);
      
      const result = await reportService.forwardToAuthority(id, {
        authorityKey,
        authorityName,
        authorityEmail,
        comment,
        performedBy: req.admin.id
      });
      
      res.json({
        success: true,
        forwardedTo: authorityName,
        emailId: result.emailResult?.messageId
      });
    } catch (error) {
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'not_found',
          message: 'Meldung nicht gefunden'
        });
      }
      next(error);
    }
  }
);

/**
 * POST /api/admin/reports/:id/reforward
 * Meldung erneut weiterleiten
 */
router.post('/reports/:id/reforward',
  requireAdminRole,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, authorityName, authorityEmail } = req.body;
      
      log('admin', `Re-forwarding ${id} to ${authorityName || 'auto'} by ${req.admin.email}`);
      
      const result = await reportService.reforwardReport(id, {
        reason: reason || 'Erneute Weiterleitung durch Sachbearbeiter',
        authorityName,
        authorityEmail,
        performedBy: req.admin.id
      });
      
      res.json({
        success: true,
        forwardedTo: result.forwardedTo,
        emailId: result.emailResult?.messageId
      });
    } catch (error) {
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'not_found',
          message: 'Meldung nicht gefunden'
        });
      }
      if (error.message === 'No routing rule found') {
        return res.status(400).json({
          error: 'no_routing_rule',
          message: 'Keine passende Weiterleitungsregel gefunden'
        });
      }
      next(error);
    }
  }
);

/**
 * GET /api/admin/export
 * Meldungen exportieren (CSV oder JSON)
 */
router.get('/export',
  requireViewerRole,
  async (req, res, next) => {
    try {
      const { format = 'json', status, category, from, to } = req.query;
      
      const data = await reportService.exportReports({ status, category, from, to }, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=meldungen-${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\ufeff' + data); // BOM für Excel
      } else {
        res.setHeader('Content-Disposition', `attachment; filename=meldungen-${new Date().toISOString().split('T')[0]}.json`);
        res.json(data);
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/routing-rules
 * Routing-Regeln auflisten
 */
router.get('/routing-rules',
  requireViewerRole,
  async (req, res, next) => {
    try {
      const rules = await routingService.listRules();
      res.json(rules);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/routing-rules
 * Neue Routing-Regel erstellen
 */
router.post('/routing-rules',
  requireAdminRole,
  async (req, res, next) => {
    try {
      const rule = await routingService.createRule(req.body);
      res.status(201).json(rule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/routing-rules/:id
 * Routing-Regel aktualisieren
 */
router.put('/routing-rules/:id',
  requireAdminRole,
  async (req, res, next) => {
    try {
      const rule = await routingService.updateRule(req.params.id, req.body);
      res.json(rule);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/admin/routing-rules/:id
 * Routing-Regel löschen
 */
router.delete('/routing-rules/:id',
  requireAdminRole,
  async (req, res, next) => {
    try {
      await routingService.deleteRule(req.params.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/stats
 * Dashboard-Statistiken
 */
router.get('/stats',
  requireViewerRole,
  async (req, res, next) => {
    try {
      // Einfache Statistiken
      const allReports = await reportService.listReports({ limit: 10000 });
      const reports = allReports.data;
      
      const stats = {
        total: allReports.pagination.total,
        byStatus: {},
        byCategory: {},
        recent: reports.slice(0, 5).map(r => ({
          ticketId: r.ticketId,
          category: r.category,
          status: r.status,
          createdAt: r.createdAt
        }))
      };
      
      // Nach Status gruppieren
      for (const report of reports) {
        stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
        stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1;
      }
      
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export { router as adminRouter };
