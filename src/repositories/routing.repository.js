import prisma from '../db.js';

/**
 * Routing Rule Repository - Weiterleitungsregeln
 */

/**
 * Findet die passende Routing-Regel für Kategorie und Bezirk
 * Priorität: exakter Match > Kategorie + * > * + Bezirk > * + *
 */
export async function findMatchingRule(category, district) {
  // Alle aktiven Regeln laden, die passen könnten
  const rules = await prisma.routingRule.findMany({
    where: {
      isActive: true,
      OR: [
        { category, district },           // Exakter Match
        { category, district: '*' },      // Kategorie + beliebiger Bezirk
        { category: '*', district },      // Beliebige Kategorie + Bezirk
        { category: '*', district: '*' }  // Fallback
      ]
    },
    orderBy: { priority: 'desc' }
  });

  if (rules.length === 0) {
    return null;
  }

  // Die Regel mit höchster Priorität zurückgeben
  // Bei gleicher Priorität: spezifischere Regel bevorzugen
  return rules.sort((a, b) => {
    // Erst nach Priorität sortieren
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    
    // Bei gleicher Priorität: Spezifität
    const specificityA = (a.category !== '*' ? 2 : 0) + (a.district !== '*' ? 1 : 0);
    const specificityB = (b.category !== '*' ? 2 : 0) + (b.district !== '*' ? 1 : 0);
    
    return specificityB - specificityA;
  })[0];
}

/**
 * Erstellt eine neue Routing-Regel
 */
export async function createRule(data) {
  return prisma.routingRule.create({
    data: {
      category: data.category,
      district: data.district,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      priority: data.priority || 0,
      isActive: data.isActive !== false
    }
  });
}

/**
 * Listet alle Routing-Regeln
 */
export async function findAll() {
  return prisma.routingRule.findMany({
    orderBy: [
      { priority: 'desc' },
      { category: 'asc' },
      { district: 'asc' }
    ]
  });
}

/**
 * Aktualisiert eine Routing-Regel
 */
export async function updateRule(id, data) {
  return prisma.routingRule.update({
    where: { id },
    data
  });
}

/**
 * Löscht eine Routing-Regel
 */
export async function deleteRule(id) {
  return prisma.routingRule.delete({
    where: { id }
  });
}

/**
 * Seed: Erstellt Standard-Routing-Regeln falls keine existieren
 */
export async function seedDefaultRules() {
  const count = await prisma.routingRule.count();
  
  if (count > 0) {
    return { seeded: false, count };
  }

  const defaultRules = [
    { category: 'TRASH', district: '*', recipientEmail: 'muell@stadt.example.de', recipientName: 'Müllabfuhr', priority: 10 },
    { category: 'DAMAGE', district: '*', recipientEmail: 'strassenbau@stadt.example.de', recipientName: 'Straßenbauamt', priority: 10 },
    { category: 'VANDALISM', district: '*', recipientEmail: 'ordnung@stadt.example.de', recipientName: 'Ordnungsamt', priority: 10 },
    { category: 'OTHER', district: '*', recipientEmail: 'buergerbuero@stadt.example.de', recipientName: 'Bürgerbüro', priority: 5 },
    { category: '*', district: '*', recipientEmail: 'zentrale@stadt.example.de', recipientName: 'Zentrale', priority: 0 }
  ];

  await prisma.routingRule.createMany({
    data: defaultRules
  });

  return { seeded: true, count: defaultRules.length };
}
