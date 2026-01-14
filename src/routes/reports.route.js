import { Router } from 'express';
import path from 'path';
import * as reportService from '../services/report.service.js';
import * as geocodingService from '../services/geocoding.service.js';
import { uploadPhotos, handleUploadError } from '../middlewares/upload.js';
import { reportRateLimiter } from '../middlewares/rate-limit.js';
import { validateCreateReport, validateTicketId } from '../middlewares/validation.js';
import { log } from '../logger.js';

const router = Router();

/**
 * POST /api/reports
 * Erstellt eine neue Meldung
 */
router.post('/',
  uploadPhotos,
  handleUploadError,
  reportRateLimiter,
  validateCreateReport,
  async (req, res, next) => {
    try {
      const { category, latitude, longitude, comment, urgency, contactEmail, deviceId } = req.body;

      log('route', `Creating report: ${category} at ${latitude}, ${longitude}`);

      // Reverse Geocoding für Adresse und Bezirk
      let address = null;
      let district = null;
      
      try {
        const geoResult = await geocodingService.reverseGeocode(latitude, longitude);
        if (geoResult) {
          address = geoResult.address;
          district = geoResult.district;
        }
      } catch (geoError) {
        log('warning', `Geocoding failed: ${geoError.message}`);
      }

      // Fotos sammeln
      const photos = [];
      
      // Pflichtfoto
      if (req.files?.photo?.[0]) {
        const photo = req.files.photo[0];
        photos.push({
          filename: photo.originalname,
          storagePath: photo.path,
          mimeType: photo.mimetype,
          size: photo.size
        });
      }
      
      // Zusätzliche Fotos
      if (req.files?.photos) {
        for (const photo of req.files.photos) {
          photos.push({
            filename: photo.originalname,
            storagePath: photo.path,
            mimeType: photo.mimetype,
            size: photo.size
          });
        }
      }

      // Meldung erstellen
      const report = await reportService.createReport({
        category,
        latitude,
        longitude,
        address,
        district,
        comment,
        urgency: urgency || 'MEDIUM',
        contactEmail: contactEmail || null,
        deviceId,
        privacyAccepted: true
      }, photos);

      log('route', `Created report: ${report.ticketId}`);

      res.status(201).json({
        success: true,
        ticketId: report.ticketId,
        status: report.status,
        message: 'Ihre Meldung wurde erfolgreich erstellt.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/reports/:ticketId
 * Ruft den öffentlichen Status einer Meldung ab
 */
router.get('/:ticketId',
  validateTicketId,
  async (req, res, next) => {
    try {
      const { ticketId } = req.params;
      
      log('route', `Getting status for: ${ticketId}`);
      
      const status = await reportService.getPublicStatus(ticketId);
      
      if (!status) {
        return res.status(404).json({
          error: 'not_found',
          message: 'Meldung nicht gefunden'
        });
      }
      
      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

export { router as reportsRouter };
