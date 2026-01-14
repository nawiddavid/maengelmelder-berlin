import prisma from '../db.js';

/**
 * Admin Repository - Administratoren-Verwaltung
 */

/**
 * Findet einen Admin anhand der E-Mail
 */
export async function findByEmail(email) {
  return prisma.admin.findUnique({
    where: { email }
  });
}

/**
 * Findet einen Admin anhand der ID
 */
export async function findById(id) {
  return prisma.admin.findUnique({
    where: { id }
  });
}

/**
 * Erstellt einen neuen Admin
 */
export async function createAdmin(data) {
  return prisma.admin.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role || 'VIEWER'
    }
  });
}

/**
 * Aktualisiert den letzten Login-Zeitpunkt
 */
export async function updateLastLogin(id) {
  return prisma.admin.update({
    where: { id },
    data: { lastLoginAt: new Date() }
  });
}

/**
 * Listet alle Admins
 */
export async function findAll() {
  return prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * Seed: Erstellt einen Default-Admin falls keiner existiert
 */
export async function seedDefaultAdmin(passwordHash) {
  const count = await prisma.admin.count();
  
  if (count > 0) {
    return { seeded: false };
  }

  const admin = await prisma.admin.create({
    data: {
      email: 'admin@maengelmelder.de',
      passwordHash,
      name: 'Administrator',
      role: 'ADMIN'
    }
  });

  return { seeded: true, admin };
}
