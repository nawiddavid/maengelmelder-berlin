/**
 * Ticket-ID Generator für Mängelmelder
 * Format: XX-YYYYMMDD-XXXXX
 * - XX = Kategorie-Code (MU=Müll, SC=Schäden, VA=Vandalismus, SO=Sonstiges)
 * - YYYYMMDD = Datum
 * - XXXXX = Zufälliger 5-stelliger alphanumerischer Code
 */

const CATEGORY_CODES = {
  TRASH: 'MU',
  DAMAGE: 'SC',
  VANDALISM: 'VA',
  OTHER: 'SO'
};

/**
 * Generiert einen zufälligen alphanumerischen String
 * @param {number} length - Länge des Strings
 * @returns {string}
 */
function generateRandomCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1 für bessere Lesbarkeit
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formatiert ein Datum als YYYYMMDD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generiert eine neue Ticket-ID
 * @param {string} category - TRASH, DAMAGE, VANDALISM, OTHER
 * @returns {string} Ticket-ID im Format XX-YYYYMMDD-XXXXX
 */
export function generateTicketId(category) {
  const categoryCode = CATEGORY_CODES[category] || 'SO';
  const dateCode = formatDate();
  const randomCode = generateRandomCode(5);
  
  return `${categoryCode}-${dateCode}-${randomCode}`;
}

/**
 * Validiert eine Ticket-ID
 * @param {string} ticketId
 * @returns {boolean}
 */
export function isValidTicketId(ticketId) {
  const pattern = /^[A-Z]{2}-\d{8}-[A-Z0-9]{5}$/;
  return pattern.test(ticketId);
}

/**
 * Extrahiert Informationen aus einer Ticket-ID
 * @param {string} ticketId
 * @returns {object|null}
 */
export function parseTicketId(ticketId) {
  if (!isValidTicketId(ticketId)) {
    return null;
  }
  
  const [categoryCode, dateStr, randomCode] = ticketId.split('-');
  
  // Kategorie aus Code ermitteln
  const category = Object.entries(CATEGORY_CODES).find(
    ([, code]) => code === categoryCode
  )?.[0] || 'OTHER';
  
  // Datum parsen
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const date = new Date(year, month, day);
  
  return {
    category,
    date,
    code: randomCode
  };
}
