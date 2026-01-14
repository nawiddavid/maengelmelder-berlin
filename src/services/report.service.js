import * as reportRepo from '../repositories/report.repository.js';
import * as auditRepo from '../repositories/audit.repository.js';
import * as routingService from './routing.service.js';
import * as emailService from './email.service.js';
import { generateTicketId } from '../utils/ticket-id.js';
import { log } from '../logger.js';

/**
 * Report Service - Geschäftslogik für Meldungen
 */

// Gültige Werte
export const CATEGORIES = ['TRASH', 'DAMAGE', 'VANDALISM', 'OTHER'];
export const STATUSES = ['SUBMITTED', 'FORWARDED', 'IN_PROGRESS', 'DONE'];
export const URGENCIES = ['LOW', 'MEDIUM', 'HIGH'];

// Status-Labels für Anzeige
export const STATUS_LABELS = {
  SUBMITTED: 'Eingereicht',
  FORWARDED: 'Weitergeleitet',
  IN_PROGRESS: 'In Bearbeitung',
  DONE: 'Erledigt'
};

export const CATEGORY_LABELS = {
  TRASH: 'Müll',
  DAMAGE: 'Schäden an Infrastruktur',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges'
};

/**
 * Erstellt eine neue Meldung
 */
export async function createReport(data, photos = []) {
  // Ticket-ID generieren
  const ticketId = generateTicketId(data.category);
  
  log('service', `Creating report ${ticketId} for category ${data.category}`);
  
  // Meldung erstellen
  const report = await reportRepo.createReport({
    ...data,
    ticketId
  });
  
  // Fotos hinzufügen
  for (const photo of photos) {
    await reportRepo.addPhoto(report.id, photo);
  }
  
  // Audit-Log: Erstellt
  await auditRepo.createLog(report.id, 'CREATED', {
    category: data.category,
    ticketId
  });
  
  // Weiterleitung anstoßen (async, nicht blockierend)
  forwardReport(report.id).catch(err => {
    log('error', `Failed to forward report ${ticketId}: ${err.message}`);
  });
  
  // Report mit Fotos neu laden
  return reportRepo.findById(report.id);
}

/**
 * Leitet eine Meldung an die zuständige Stelle weiter
 */
export async function forwardReport(reportId) {
  const report = await reportRepo.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  // Routing-Regel finden
  const rule = await routingService.findRoutingRule(
    report.category,
    report.district
  );
  
  if (!rule) {
    log('warning', `No routing rule found for ${report.ticketId}`);
    return null;
  }
  
  log('service', `Forwarding ${report.ticketId} to ${rule.recipientName}`);
  
  // E-Mail senden
  const emailResult = await emailService.sendReportEmail(report, rule);
  
  // Status auf FORWARDED setzen
  await reportRepo.updateStatus(report.id, 'FORWARDED');
  
  // Audit-Log: Weitergeleitet
  await auditRepo.createLog(report.id, 'FORWARDED', {
    recipientEmail: rule.recipientEmail,
    recipientName: rule.recipientName,
    emailId: emailResult?.messageId || 'demo'
  });
  
  return { rule, emailResult };
}

/**
 * Leitet eine Meldung manuell an eine zuständige Stelle weiter
 */
export async function forwardToAuthority(reportId, options) {
  const { authorityKey, authorityName, authorityEmail, comment, performedBy } = options;
  
  const report = await reportRepo.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  log('service', `Manually forwarding ${report.ticketId} to ${authorityName}`);
  
  // E-Mail senden (falls E-Mail-Adresse vorhanden)
  let emailResult = null;
  if (authorityEmail) {
    const fakeRule = {
      recipientEmail: authorityEmail,
      recipientName: authorityName
    };
    emailResult = await emailService.sendReportEmail(report, fakeRule);
  }
  
  // Status auf FORWARDED setzen
  await reportRepo.updateStatus(report.id, 'FORWARDED');
  
  // Audit-Log: Weitergeleitet
  await auditRepo.createLog(report.id, 'FORWARDED', {
    authorityKey,
    recipientEmail: authorityEmail || '',
    recipientName: authorityName,
    comment: comment || '',
    emailId: emailResult?.messageId || 'manual'
  }, performedBy);
  
  return { 
    forwardedTo: authorityName,
    emailResult 
  };
}

/**
 * Leitet eine Meldung erneut weiter
 */
export async function reforwardReport(reportId, options) {
  const { reason, authorityName, authorityEmail, performedBy } = options;
  
  const report = await reportRepo.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  let recipientName = authorityName;
  let recipientEmail = authorityEmail;
  
  // Falls keine Stelle angegeben, automatisch ermitteln
  if (!recipientName) {
    const rule = await routingService.findRoutingRule(
      report.category,
      report.district
    );
    
    if (!rule) {
      throw new Error('No routing rule found');
    }
    
    recipientName = rule.recipientName;
    recipientEmail = rule.recipientEmail;
  }
  
  log('service', `Re-forwarding ${report.ticketId} to ${recipientName}`);
  
  // E-Mail senden
  let emailResult = null;
  if (recipientEmail) {
    const fakeRule = {
      recipientEmail,
      recipientName
    };
    emailResult = await emailService.sendReportEmail(report, fakeRule);
  }
  
  // Audit-Log: Erneut weitergeleitet
  await auditRepo.createLog(report.id, 'REFORWARDED', {
    reason,
    recipientEmail: recipientEmail || '',
    recipientName,
    emailId: emailResult?.messageId || 'manual'
  }, performedBy);
  
  return { 
    forwardedTo: recipientName,
    emailResult 
  };
}

/**
 * Ändert den Status einer Meldung
 */
export async function changeStatus(reportId, newStatus, adminId) {
  const report = await reportRepo.findById(reportId);
  
  if (!report) {
    throw new Error('Report not found');
  }
  
  if (!STATUSES.includes(newStatus)) {
    throw new Error('Invalid status');
  }
  
  const oldStatus = report.status;
  
  log('service', `Changing status of ${report.ticketId}: ${oldStatus} -> ${newStatus}`);
  
  const updated = await reportRepo.updateStatus(reportId, newStatus);
  
  // Audit-Log: Status geändert
  await auditRepo.createLog(reportId, 'STATUS_CHANGED', {
    oldStatus,
    newStatus
  }, adminId);
  
  // E-Mail an Melder senden, falls angegeben
  if (report.contactEmail && oldStatus !== newStatus) {
    emailService.sendStatusUpdateEmail(report, newStatus).catch(err => {
      log('error', `Failed to send status update email: ${err.message}`);
    });
  }
  
  return updated;
}

/**
 * Ruft den öffentlichen Status einer Meldung ab
 */
export async function getPublicStatus(ticketId) {
  const report = await reportRepo.findByTicketId(ticketId);
  
  if (!report) {
    return null;
  }
  
  // Letzten FORWARDED-Log für "weitergeleitet an" Info
  const forwardedLog = await auditRepo.findLastForwarded(report.id);
  let forwardedTo = null;
  
  if (forwardedLog) {
    try {
      const details = JSON.parse(forwardedLog.details);
      forwardedTo = details.recipientName;
    } catch (e) {
      // Ignorieren
    }
  }
  
  return {
    ticketId: report.ticketId,
    category: report.category,
    categoryLabel: CATEGORY_LABELS[report.category],
    status: report.status,
    statusLabel: STATUS_LABELS[report.status],
    forwardedTo,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
}

/**
 * Ruft Details einer Meldung für Admin ab
 */
export async function getReportDetails(reportId) {
  const report = await reportRepo.findById(reportId);
  
  if (!report) {
    return null;
  }
  
  // Audit-Logs parsen
  const auditLogs = report.auditLogs.map(log => ({
    action: log.action,
    details: JSON.parse(log.details || '{}'),
    performedBy: log.performedBy,
    timestamp: log.timestamp
  }));
  
  return {
    ...report,
    categoryLabel: CATEGORY_LABELS[report.category],
    statusLabel: STATUS_LABELS[report.status],
    auditLogs
  };
}

/**
 * Listet Meldungen mit Filtern
 */
export async function listReports(filters) {
  return reportRepo.findAll(filters);
}

/**
 * Exportiert Meldungen
 */
export async function exportReports(filters, format = 'json') {
  const reports = await reportRepo.exportAll(filters);
  
  const data = reports.map(r => {
    let forwardedTo = '';
    if (r.auditLogs?.[0]) {
      try {
        const details = JSON.parse(r.auditLogs[0].details);
        forwardedTo = details.recipientName || '';
      } catch (e) {}
    }
    
    return {
      ticketId: r.ticketId,
      category: r.category,
      categoryLabel: CATEGORY_LABELS[r.category],
      status: r.status,
      statusLabel: STATUS_LABELS[r.status],
      address: r.address || '',
      district: r.district || '',
      comment: r.comment,
      urgency: r.urgency,
      contactEmail: r.contactEmail || '',
      createdAt: r.createdAt.toISOString(),
      forwardedTo
    };
  });
  
  if (format === 'csv') {
    return convertToCSV(data);
  }
  
  return data;
}

/**
 * Konvertiert Daten zu CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const value = row[h]?.toString() || '';
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}
