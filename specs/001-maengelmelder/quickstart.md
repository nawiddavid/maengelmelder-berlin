# Quickstart: Mängelmelder

**Feature**: 001-maengelmelder  
**Geschätzte Setup-Zeit**: 10 Minuten

---

## Voraussetzungen

- Node.js ≥ 20.0.0
- npm ≥ 10.x
- Git

## 1. Repository & Dependencies

```bash
# Falls noch nicht geschehen
cd hackathon-main

# Dependencies installieren
npm install

# Neue Dependencies für Mängelmelder
npm install multer nodemailer express-rate-limit express-session bcrypt uuid express-validator
```

## 2. Datenbank einrichten

```bash
# Prisma-Schema aktualisieren (nach Änderungen in schema.prisma)
npx prisma migrate dev --name add-maengelmelder-models

# Prisma Client generieren
npx prisma generate

# Optional: Datenbank im Browser anschauen
npm run prisma:studio
```

## 3. Umgebungsvariablen

Erstelle/erweitere `.env`:

```env
# Bestehend
DATABASE_URL="file:./dev.db"

# NEU: E-Mail-Konfiguration (für Demo: Console-Log verwenden)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=maengelmelder@example.com
SMTP_PASS=your-password
SMTP_FROM="Mängelmelder <maengelmelder@example.com>"

# NEU: Session-Secret (zufälligen String generieren!)
SESSION_SECRET=ein-sehr-langes-geheimes-passwort-hier-eintragen

# NEU: Admin-Passwort für erste Einrichtung
ADMIN_DEFAULT_PASSWORD=admin123

# Optional: Nominatim Geocoding (standardmäßig öffentliches API)
NOMINATIM_URL=https://nominatim.openstreetmap.org
```

## 4. Uploads-Ordner erstellen

```bash
mkdir -p uploads
echo "uploads/" >> .gitignore
```

## 5. Entwicklungsserver starten

```bash
npm run dev
```

Der Server läuft auf `http://localhost:3000`

## 6. Erste Admin-Nutzer erstellen

Nach dem Start einmalig ausführen (oder über Prisma Studio):

```bash
# Via Prisma Studio
npm run prisma:studio
# → Tabelle "Admin" öffnen → Neuen Eintrag anlegen
```

Oder per Node-Skript:

```javascript
// scripts/create-admin.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  await prisma.admin.create({
    data: {
      email: 'admin@maengelmelder.de',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN'
    }
  });
  
  console.log('Admin erstellt: admin@maengelmelder.de / admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## 7. Routing-Regeln einrichten

Beispiel-Routing-Regeln via Prisma Studio oder Seed-Script:

```javascript
// prisma/seed.js
const routingRules = [
  { category: 'TRASH', district: '*', recipientEmail: 'muell@stadt.de', recipientName: 'Müllabfuhr', priority: 10 },
  { category: 'DAMAGE', district: '*', recipientEmail: 'strassenbau@stadt.de', recipientName: 'Straßenbauamt', priority: 10 },
  { category: 'VANDALISM', district: '*', recipientEmail: 'ordnung@stadt.de', recipientName: 'Ordnungsamt', priority: 10 },
  { category: '*', district: '*', recipientEmail: 'zentrale@stadt.de', recipientName: 'Bürgerbüro', priority: 0 }
];
```

---

## Endpunkte testen

### Neue Meldung erstellen (cURL)

```bash
curl -X POST http://localhost:3000/api/reports \
  -F "category=TRASH" \
  -F "latitude=52.520008" \
  -F "longitude=13.404954" \
  -F "comment=Müll neben dem Container" \
  -F "deviceId=test-device-123" \
  -F "privacyAccepted=true" \
  -F "photo=@./test-image.jpg"
```

### Status abfragen

```bash
curl http://localhost:3000/api/reports/MU-20260114-A7K2X
```

### Admin-Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maengelmelder.de","password":"admin123"}' \
  -c cookies.txt
```

### Admin: Meldungen auflisten

```bash
curl http://localhost:3000/api/admin/reports \
  -b cookies.txt
```

---

## Frontend-Seiten

Nach der Implementierung:

| URL | Beschreibung |
|-----|--------------|
| `/` | Landing Page |
| `/report.html` | Meldung erstellen |
| `/status.html` | Status abfragen |
| `/admin/login.html` | Admin-Login |
| `/admin/` | Admin-Dashboard |

---

## Häufige Probleme

### Prisma-Migration schlägt fehl

```bash
# Datenbank zurücksetzen (Achtung: löscht alle Daten!)
npx prisma migrate reset

# Oder: Nur Schema pushen ohne Migration
npx prisma db push
```

### E-Mail-Versand funktioniert nicht

Für Demo/Entwicklung: In `src/services/email.service.js` auf Console-Log umstellen:

```javascript
export async function sendEmail(to, subject, html) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 E-Mail simuliert:', { to, subject });
    return { messageId: 'demo-' + Date.now() };
  }
  // ... echter Versand
}
```

### Rate-Limiting zu streng

In `src/middlewares/rate-limit.js` anpassen:

```javascript
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
  // ...
});
```

---

## Nächste Schritte

1. **`/speckit.tasks`** ausführen für detaillierte Aufgabenliste
2. Backend-Services implementieren
3. Frontend-Formulare bauen
4. Tests schreiben
5. Styling finalisieren
