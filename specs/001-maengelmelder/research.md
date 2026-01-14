# Research: Mängelmelder

**Feature**: 001-maengelmelder  
**Created**: 2026-01-14

---

## Tech Stack Analyse

### Vorhandene Infrastruktur (aus package.json)
- **Runtime**: Node.js ≥ 20.0.0
- **Backend**: Express.js 4.19.2
- **Database ORM**: Prisma 5.20.0
- **Database**: SQLite (dev.db)
- **Testing**: Vitest 1.3.1 + Supertest 7.1.4

### Empfohlene Ergänzungen

#### Frontend
| Komponente | Empfehlung | Begründung |
|------------|------------|------------|
| UI Framework | Vanilla JS (bestehend) | Leichtgewichtig, keine Build-Pipeline nötig |
| CSS | Bestehendes styles.css | Matrix-Theme bereits vorhanden |
| Karten | Leaflet.js + OpenStreetMap | Open Source, kein API-Key nötig |
| Foto-Upload | HTML5 File API + Canvas | Native Komprimierung |
| Geolocation | Browser Geolocation API | Standard, kein Paket nötig |

#### Backend (Ergänzungen)
| Komponente | Empfehlung | Begründung |
|------------|------------|------------|
| E-Mail | Nodemailer | Standard für Node.js, einfache Config |
| File Upload | Multer | Express-Middleware für multipart/form-data |
| Rate Limiting | express-rate-limit | Einfach, bewährt |
| Geocoding | Nominatim (OSM) | Kostenlos, keine API-Keys |
| Validation | express-validator oder Zod | Schema-Validierung |
| Auth (Admin) | express-session + bcrypt | Einfach für MVP |

---

## Architektur-Entscheidungen

### 1. Datenbankschema (Prisma)

```prisma
model Report {
  id           String   @id @default(cuid())
  ticketId     String   @unique
  category     Category
  status       Status   @default(SUBMITTED)
  photos       Photo[]
  latitude     Float
  longitude    Float
  address      String?
  district     String?
  comment      String
  urgency      Urgency  @default(MEDIUM)
  contactEmail String?
  deviceId     String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  auditLogs    AuditLog[]
}

model Photo {
  id        String   @id @default(cuid())
  reportId  String
  report    Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  filename  String
  path      String
  size      Int
  createdAt DateTime @default(now())
}

model RoutingRule {
  id             String  @id @default(cuid())
  category       String  // Category enum oder "*"
  district       String  // Bezirk oder "*"
  recipientEmail String
  recipientName  String
  priority       Int     @default(0)
  isActive       Boolean @default(true)
}

model AuditLog {
  id          String   @id @default(cuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  action      Action
  details     String   // JSON
  performedBy String   // "system" oder Admin-ID
  timestamp   DateTime @default(now())
}

model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(VIEWER)
  createdAt    DateTime @default(now())
}

enum Category {
  TRASH
  DAMAGE
  VANDALISM
  OTHER
}

enum Status {
  SUBMITTED
  FORWARDED
  IN_PROGRESS
  DONE
}

enum Urgency {
  LOW
  MEDIUM
  HIGH
}

enum Action {
  CREATED
  FORWARDED
  STATUS_CHANGED
  REFORWARDED
  DELETED
}

enum Role {
  ADMIN
  VIEWER
}
```

### 2. API-Endpunkte

```
POST   /api/reports              - Neue Meldung erstellen
GET    /api/reports/:ticketId    - Status einer Meldung (öffentlich)
POST   /api/reports/:id/photos   - Foto hochladen

GET    /api/admin/reports        - Alle Meldungen (Admin)
GET    /api/admin/reports/:id    - Meldungsdetails (Admin)
PATCH  /api/admin/reports/:id    - Status ändern (Admin)
POST   /api/admin/reports/:id/reforward - Erneut weiterleiten (Admin)
GET    /api/admin/export         - CSV/JSON Export (Admin)

GET    /api/routing-rules        - Routing-Regeln (Admin)
POST   /api/routing-rules        - Regel erstellen (Admin)
PUT    /api/routing-rules/:id    - Regel bearbeiten (Admin)

POST   /api/auth/login           - Admin Login
POST   /api/auth/logout          - Admin Logout
```

### 3. Datei-Struktur (erweitert)

```
/
├── public/
│   ├── index.html          # Landing Page
│   ├── report.html         # Meldung erstellen
│   ├── status.html         # Status abfragen
│   ├── admin/
│   │   ├── index.html      # Admin Dashboard
│   │   ├── login.html      # Admin Login
│   │   └── report.html     # Meldungsdetail
│   ├── app.js              # Bestehendes Frontend JS
│   ├── report.js           # Meldungs-Formular Logic
│   ├── map.js              # Leaflet Karten-Integration
│   ├── admin.js            # Admin Dashboard Logic
│   └── styles.css          # Bestehendes Matrix-Theme
├── src/
│   ├── routes/
│   │   ├── reports.route.js
│   │   ├── admin.route.js
│   │   └── auth.route.js
│   ├── services/
│   │   ├── report.service.js
│   │   ├── routing.service.js
│   │   ├── email.service.js
│   │   └── geocoding.service.js
│   ├── repositories/
│   │   ├── report.repository.js
│   │   ├── routing.repository.js
│   │   └── admin.repository.js
│   ├── middlewares/
│   │   ├── rate-limit.js
│   │   ├── upload.js
│   │   ├── auth.js
│   │   └── validation.js
│   └── utils/
│       ├── ticket-id.js
│       └── compress-image.js
├── uploads/                # Foto-Speicher (gitignore)
└── prisma/
    └── schema.prisma
```

---

## Technische Details

### Ticket-ID Format
`MM-YYYYMMDD-XXXXX`
- MM = Kategorie-Code (MU=Müll, SC=Schäden, VA=Vandalismus, SO=Sonstiges)
- YYYYMMDD = Datum
- XXXXX = Zufälliger 5-stelliger alphanumerischer Code

Beispiel: `MU-20260114-A7K2X`

### Foto-Komprimierung (Client-Side)
```javascript
// Canvas-basierte Komprimierung auf max 2MB / 1920px
async function compressImage(file, maxSizeMB = 2, maxDimension = 1920) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}
```

### Rate Limiting Config
```javascript
// 5 Meldungen pro Gerät pro Stunde
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  keyGenerator: (req) => req.body.deviceId || req.ip,
  message: { error: 'Zu viele Meldungen. Bitte warten Sie eine Stunde.' }
});
```

### E-Mail Template
```html
<h2>Neue Meldung: {{ticketId}}</h2>
<p><strong>Kategorie:</strong> {{category}}</p>
<p><strong>Dringlichkeit:</strong> {{urgency}}</p>
<p><strong>Standort:</strong> {{address}}</p>
<p><a href="https://maps.google.com/?q={{lat}},{{lng}}">📍 Auf Karte anzeigen</a></p>
<p><strong>Beschreibung:</strong><br>{{comment}}</p>
<p><strong>Fotos:</strong></p>
{{#each photos}}<img src="cid:{{this.cid}}" width="400">{{/each}}
<hr>
<p>Gemeldet am: {{createdAt}}</p>
<p>Ticket-ID: {{ticketId}}</p>
```

---

## Offene Fragen / Klärungsbedarf

1. **SMTP-Konfiguration**: Welcher E-Mail-Provider soll verwendet werden?
   - Option A: Eigener SMTP-Server
   - Option B: Transactional E-Mail Service (SendGrid, Mailgun, etc.)
   - Option C: Gmail SMTP (nur für Demo/Test)

2. **Bezirks-Zuordnung**: Wie sollen Koordinaten auf Bezirke gemappt werden?
   - Option A: Manuelle GeoJSON-Polygone
   - Option B: Reverse Geocoding API
   - Option C: Postleitzahlen-Mapping

3. **Admin-Authentifizierung**: Wie komplex?
   - Option A: Einfacher Username/Passwort (MVP)
   - Option B: OAuth/SSO-Integration
   - Option C: Magic Links

4. **Hosting**: Wo soll die App deployed werden?
   - Die App sollte auf einem einfachen Node.js-Host laufen können (z.B. Railway, Render, Fly.io)

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| GPS ungenau in Städten | Hoch | Mittel | Karten-Pin-Korrektur + manuelle Eingabe |
| Spam-Missbrauch | Mittel | Hoch | Rate-Limiting + Honeypot |
| E-Mail landet in Spam | Mittel | Hoch | SPF/DKIM konfigurieren, Whitelisting |
| Große Bilder überlasten Server | Mittel | Mittel | Client-Side Komprimierung |
| SQLite bei hoher Last | Niedrig | Mittel | Bei Bedarf auf PostgreSQL migrieren |

---

## Abhängigkeiten (zu installieren)

```bash
npm install multer nodemailer express-rate-limit express-session bcrypt uuid
npm install leaflet   # Als CDN im Frontend
```
