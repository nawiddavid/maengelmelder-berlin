import prisma from '../db.js';

/**
 * Report Repository - Datenbankzugriff für Meldungen
 */

/**
 * Erstellt eine neue Meldung
 */
export async function createReport(data) {
  return prisma.report.create({
    data: {
      ticketId: data.ticketId,
      category: data.category,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      district: data.district,
      comment: data.comment,
      urgency: data.urgency || 'MEDIUM',
      contactEmail: data.contactEmail,
      deviceId: data.deviceId,
      privacyAccepted: data.privacyAccepted
    },
    include: {
      photos: true
    }
  });
}

/**
 * Fügt ein Foto zu einer Meldung hinzu
 */
export async function addPhoto(reportId, photoData) {
  return prisma.photo.create({
    data: {
      reportId,
      filename: photoData.filename,
      storagePath: photoData.storagePath,
      mimeType: photoData.mimeType,
      size: photoData.size
    }
  });
}

/**
 * Findet eine Meldung anhand der Ticket-ID (öffentlich)
 */
export async function findByTicketId(ticketId) {
  return prisma.report.findUnique({
    where: { ticketId },
    include: {
      photos: true,
      auditLogs: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });
}

/**
 * Findet eine Meldung anhand der internen ID
 */
export async function findById(id) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      photos: true,
      auditLogs: {
        orderBy: { timestamp: 'desc' }
      }
    }
  });
}

/**
 * Aktualisiert den Status einer Meldung
 */
export async function updateStatus(id, status) {
  return prisma.report.update({
    where: { id },
    data: { status },
    include: {
      photos: true
    }
  });
}

/**
 * Aktualisiert eine Meldung
 */
export async function updateReport(id, data) {
  return prisma.report.update({
    where: { id },
    data,
    include: {
      photos: true
    }
  });
}

/**
 * Listet alle Meldungen mit Filtern und Paginierung
 */
export async function findAll(filters = {}) {
  const {
    status,
    category,
    district,
    from,
    to,
    page = 1,
    limit = 20
  } = filters;

  const where = {};
  
  if (status) where.status = status;
  if (category) where.category = category;
  if (district) where.district = district;
  
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z');
  }

  const [data, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        photos: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.report.count({ where })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Zählt Meldungen eines Geräts im Zeitfenster (für Rate-Limiting)
 */
export async function countByDeviceInWindow(deviceId, windowMs) {
  const since = new Date(Date.now() - windowMs);
  
  return prisma.report.count({
    where: {
      deviceId,
      createdAt: { gte: since }
    }
  });
}

/**
 * Exportiert Meldungen (ohne Paginierung)
 */
export async function exportAll(filters = {}) {
  const { status, category, from, to } = filters;
  
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z');
  }

  return prisma.report.findMany({
    where,
    include: {
      photos: true,
      auditLogs: {
        where: { action: 'FORWARDED' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Löscht alte erledigte Meldungen (DSGVO)
 */
export async function deleteOldCompleted(daysOld = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return prisma.report.deleteMany({
    where: {
      status: 'DONE',
      updatedAt: { lt: cutoffDate }
    }
  });
}
