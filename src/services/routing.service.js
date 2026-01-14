import * as routingRepo from '../repositories/routing.repository.js';
import { log } from '../logger.js';

/**
 * Routing Service - Logik für Weiterleitungsregeln
 */

/**
 * Findet die passende Routing-Regel
 */
export async function findRoutingRule(category, district) {
  const rule = await routingRepo.findMatchingRule(category, district || '*');
  
  if (rule) {
    log('routing', `Found rule: ${category}/${district} -> ${rule.recipientName}`);
  } else {
    log('routing', `No rule found for ${category}/${district}`);
  }
  
  return rule;
}

/**
 * Listet alle Routing-Regeln
 */
export async function listRules() {
  return routingRepo.findAll();
}

/**
 * Erstellt eine neue Routing-Regel
 */
export async function createRule(data) {
  return routingRepo.createRule(data);
}

/**
 * Aktualisiert eine Routing-Regel
 */
export async function updateRule(id, data) {
  return routingRepo.updateRule(id, data);
}

/**
 * Löscht eine Routing-Regel
 */
export async function deleteRule(id) {
  return routingRepo.deleteRule(id);
}

/**
 * Initialisiert Standard-Routing-Regeln
 */
export async function seedDefaultRules() {
  const result = await routingRepo.seedDefaultRules();
  
  if (result.seeded) {
    log('routing', `Seeded ${result.count} default routing rules`);
  }
  
  return result;
}
