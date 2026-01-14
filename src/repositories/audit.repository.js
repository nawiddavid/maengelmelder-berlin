import prisma from '../db.js';

/**
 * Audit Log Repository - Protokollierung aller Aktionen
 */

/**
 * Erstellt einen Audit-Log-Eintrag
 * @param {string} reportId - ID der Meldung
 * @param {string} action - CREATED, FORWARDED, STATUS_CHANGED, REFORWARDED, DELETED
 * @param {object} details - Aktionsspezifische Details
 * @param {string} performedBy - "system" oder Admin-ID
 */
export async function createLog(reportId, action, details, performedBy = 'system') {
  return prisma.auditLog.create({
    data: {
      reportId,
      action,
      details: JSON.stringify(details),
      performedBy
    }
  });
}

/**
 * Findet alle Logs für eine Meldung
 */
export async function findByReportId(reportId) {
  return prisma.auditLog.findMany({
    where: { reportId },
    orderBy: { timestamp: 'desc' }
  });
}

/**
 * Findet den letzten FORWARDED-Log für eine Meldung
 */
export async function findLastForwarded(reportId) {
  return prisma.auditLog.findFirst({
    where: {
      reportId,
      action: 'FORWARDED'
    },
    orderBy: { timestamp: 'desc' }
  });
}
