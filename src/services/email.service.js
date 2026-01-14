import { log } from '../logger.js';

/**
 * Email Service - E-Mail-Versand für Meldungen
 * 
 * HINWEIS: Für Demo/Entwicklung wird nur geloggt.
 * Für Produktion: nodemailer konfigurieren.
 */

// In Produktion: import nodemailer from 'nodemailer';

const CATEGORY_LABELS = {
  TRASH: 'Müll',
  DAMAGE: 'Schäden an Infrastruktur',
  VANDALISM: 'Vandalismus',
  OTHER: 'Sonstiges'
};

const URGENCY_LABELS = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch ⚠️'
};

const STATUS_LABELS = {
  SUBMITTED: 'Eingereicht',
  FORWARDED: 'Weitergeleitet',
  IN_PROGRESS: 'In Bearbeitung',
  DONE: 'Erledigt'
};

/**
 * Sendet eine Meldungs-E-Mail an die zuständige Stelle
 */
export async function sendReportEmail(report, routingRule) {
  const mapsLink = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
  
  const subject = `[Mängelmelder] Neue Meldung: ${report.ticketId} - ${CATEGORY_LABELS[report.category]}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00aa35; border-bottom: 2px solid #00aa35; padding-bottom: 10px;">
        Neue Meldung: ${report.ticketId}
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 140px;">Kategorie:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${CATEGORY_LABELS[report.category]}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Dringlichkeit:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${URGENCY_LABELS[report.urgency]}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Standort:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            ${report.address || 'Keine Adresse'}<br>
            <a href="${mapsLink}" style="color: #00aa35;">📍 Auf Karte anzeigen</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Koordinaten:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${report.latitude}, ${report.longitude}</td>
        </tr>
        ${report.district ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Bezirk:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${report.district}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Gemeldet am:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(report.createdAt).toLocaleString('de-DE')}</td>
        </tr>
        ${report.contactEmail ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Kontakt:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <a href="mailto:${report.contactEmail}" style="color: #00aa35;">${report.contactEmail}</a>
          </td>
        </tr>
        ` : ''}
      </table>
      
      <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #00aa35; margin: 20px 0;">
        <strong>Beschreibung:</strong><br>
        ${report.comment.replace(/\n/g, '<br>')}
      </div>
      
      ${report.photos && report.photos.length > 0 ? `
      <div style="margin: 20px 0;">
        <strong>Fotos:</strong><br>
        <p style="color: #666; font-size: 0.9em;">
          ${report.photos.length} Foto(s) angehängt. 
          Bitte im Anhang dieser E-Mail einsehen.
        </p>
      </div>
      ` : ''}
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #666; font-size: 0.9em;">
        <strong>Ticket-ID:</strong> ${report.ticketId}<br>
        Diese Meldung wurde automatisch vom Mängelmelder-System weitergeleitet.
      </p>
    </div>
  `;

  // DEMO: Nur loggen
  if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
    log('email', `📧 E-Mail simuliert an: ${routingRule.recipientEmail}`);
    log('email', `   Betreff: ${subject}`);
    log('email', `   Meldung: ${report.ticketId}`);
    
    return {
      messageId: `demo-${Date.now()}`,
      simulated: true
    };
  }

  // PRODUKTION: Echten Versand implementieren
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: process.env.SMTP_PORT === '465',
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS
  //   }
  // });
  //
  // const result = await transporter.sendMail({
  //   from: process.env.SMTP_FROM,
  //   to: routingRule.recipientEmail,
  //   subject,
  //   html,
  //   attachments: report.photos?.map(p => ({
  //     filename: p.filename,
  //     path: p.storagePath
  //   }))
  // });
  //
  // return result;

  return {
    messageId: `demo-${Date.now()}`,
    simulated: true
  };
}

/**
 * Sendet eine Status-Update-E-Mail an den Melder
 */
export async function sendStatusUpdateEmail(report, newStatus) {
  if (!report.contactEmail) {
    return null;
  }

  const subject = `[Mängelmelder] Status-Update: ${report.ticketId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00aa35;">Status-Update für Ihre Meldung</h2>
      
      <p>Ihre Meldung <strong>${report.ticketId}</strong> hat einen neuen Status:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #00aa35; margin: 20px 0;">
        <span style="font-size: 1.2em; font-weight: bold;">
          ${STATUS_LABELS[newStatus]}
        </span>
      </div>
      
      <p>
        <strong>Kategorie:</strong> ${CATEGORY_LABELS[report.category]}<br>
        <strong>Gemeldet am:</strong> ${new Date(report.createdAt).toLocaleString('de-DE')}
      </p>
      
      <p style="color: #666; font-size: 0.9em;">
        Vielen Dank für Ihre Meldung!<br>
        Ihr Mängelmelder-Team
      </p>
    </div>
  `;

  // DEMO: Nur loggen
  if (process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST) {
    log('email', `📧 Status-Update simuliert an: ${report.contactEmail}`);
    log('email', `   Neuer Status: ${STATUS_LABELS[newStatus]}`);
    
    return { messageId: `demo-${Date.now()}`, simulated: true };
  }

  // PRODUKTION: Echten Versand implementieren (siehe oben)
  return { messageId: `demo-${Date.now()}`, simulated: true };
}
