/**
 * Validierungs-Middleware für Meldungen
 */

import { CATEGORIES, URGENCIES } from '../services/report.service.js';

/**
 * Validiert Report-Erstellung
 */
export function validateCreateReport(req, res, next) {
  const errors = [];
  const { category, latitude, longitude, comment, deviceId, privacyAccepted } = req.body;

  // Kategorie
  if (!category) {
    errors.push({ field: 'category', message: 'Kategorie ist erforderlich' });
  } else if (!CATEGORIES.includes(category)) {
    errors.push({ field: 'category', message: `Ungültige Kategorie. Erlaubt: ${CATEGORIES.join(', ')}` });
  }

  // Koordinaten
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push({ field: 'latitude', message: 'Gültige Latitude erforderlich (-90 bis 90)' });
  }
  
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push({ field: 'longitude', message: 'Gültige Longitude erforderlich (-180 bis 180)' });
  }

  // Kommentar
  if (!comment || comment.trim().length === 0) {
    errors.push({ field: 'comment', message: 'Kommentar ist erforderlich' });
  } else if (comment.length > 500) {
    errors.push({ field: 'comment', message: 'Kommentar darf maximal 500 Zeichen haben' });
  }

  // Device ID
  if (!deviceId || deviceId.trim().length === 0) {
    errors.push({ field: 'deviceId', message: 'Device ID ist erforderlich' });
  }

  // Datenschutz
  if (privacyAccepted !== 'true' && privacyAccepted !== true) {
    errors.push({ field: 'privacyAccepted', message: 'Datenschutzerklärung muss akzeptiert werden' });
  }

  // Dringlichkeit (optional)
  if (req.body.urgency && !URGENCIES.includes(req.body.urgency)) {
    errors.push({ field: 'urgency', message: `Ungültige Dringlichkeit. Erlaubt: ${URGENCIES.join(', ')}` });
  }

  // E-Mail (optional)
  if (req.body.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Ungültiges E-Mail-Format' });
    }
  }

  // Foto prüfen
  const hasPhoto = req.files?.photo?.[0] || req.file;
  if (!hasPhoto) {
    errors.push({ field: 'photo', message: 'Mindestens ein Foto ist erforderlich' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Validierung fehlgeschlagen',
      details: errors
    });
  }

  // Werte normalisieren
  req.body.latitude = lat;
  req.body.longitude = lng;
  req.body.comment = comment.trim();
  req.body.privacyAccepted = true;
  
  next();
}

/**
 * Validiert Status-Änderung
 */
export function validateStatusChange(req, res, next) {
  const { status } = req.body;
  const validStatuses = ['SUBMITTED', 'FORWARDED', 'IN_PROGRESS', 'DONE'];

  if (!status) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Status ist erforderlich'
    });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'validation_error',
      message: `Ungültiger Status. Erlaubt: ${validStatuses.join(', ')}`
    });
  }

  next();
}

/**
 * Validiert Ticket-ID Format
 */
export function validateTicketId(req, res, next) {
  const { ticketId } = req.params;
  const pattern = /^[A-Z]{2}-\d{8}-[A-Z0-9]{5}$/;

  if (!ticketId || !pattern.test(ticketId)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Ungültiges Ticket-ID Format'
    });
  }

  next();
}
