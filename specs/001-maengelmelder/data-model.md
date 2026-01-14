# Data Model: Mängelmelder

**Feature**: 001-maengelmelder  
**Created**: 2026-01-14  
**Based on**: [spec.md](./spec.md) Key Entities

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────┐       1:N        ┌──────────────┐            │
│  │    Report    │──────────────────│    Photo     │            │
│  └──────────────┘                  └──────────────┘            │
│         │                                                       │
│         │ 1:N                                                   │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │   AuditLog   │                                              │
│  └──────────────┘                                              │
│                                                                 │
│  ┌──────────────┐       (lookup)   ┌──────────────┐            │
│  │ RoutingRule  │◄─ ─ ─ ─ ─ ─ ─ ─ ─│    Report    │            │
│  └──────────────┘                  └──────────────┘            │
│                                                                 │
│  ┌──────────────┐                                              │
│  │    Admin     │ (separate, no FK to Report)                  │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entities

### 1. Report (Meldung)

Die zentrale Entität für Bürger-Meldungen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | String (CUID) | ✓ | Interne ID |
| ticketId | String (unique) | ✓ | Öffentliche ID (Format: `XX-YYYYMMDD-XXXXX`) |
| category | Enum | ✓ | TRASH, DAMAGE, VANDALISM, OTHER |
| status | Enum | ✓ | SUBMITTED, FORWARDED, IN_PROGRESS, DONE |
| latitude | Float | ✓ | GPS-Breitengrad |
| longitude | Float | ✓ | GPS-Längengrad |
| address | String | ○ | Aus Geocoding ermittelte Adresse |
| district | String | ○ | Bezirk (für Routing) |
| comment | String (max 500) | ✓ | Beschreibung des Problems |
| urgency | Enum | ○ | LOW, MEDIUM (default), HIGH |
| contactEmail | String | ○ | E-Mail für Status-Updates |
| deviceId | String | ✓ | Anonyme Geräte-ID (für Rate-Limiting) |
| privacyAccepted | Boolean | ✓ | DSGVO-Einwilligung |
| createdAt | DateTime | ✓ | Erstellungszeitpunkt |
| updatedAt | DateTime | ✓ | Letzte Änderung |

**Validierungsregeln**:
- `comment`: 1-500 Zeichen, keine HTML-Tags
- `latitude`: -90.0 bis 90.0
- `longitude`: -180.0 bis 180.0
- `contactEmail`: Gültiges E-Mail-Format (wenn angegeben)
- `privacyAccepted`: Muss `true` sein

**Status-Übergänge**:
```
SUBMITTED ──► FORWARDED ──► IN_PROGRESS ──► DONE
     │                           │
     └───────────────────────────┘ (kann direkt zu DONE wechseln)
```

---

### 2. Photo (Foto)

Fotos zu einer Meldung (1-3 pro Meldung).

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | String (CUID) | ✓ | Interne ID |
| reportId | String (FK) | ✓ | Referenz zu Report |
| filename | String | ✓ | Originaler Dateiname |
| storagePath | String | ✓ | Pfad im Dateisystem |
| mimeType | String | ✓ | MIME-Type (image/jpeg, image/png) |
| size | Int | ✓ | Dateigröße in Bytes |
| createdAt | DateTime | ✓ | Upload-Zeitpunkt |

**Validierungsregeln**:
- Max. 3 Fotos pro Report
- Max. 2MB pro Foto (nach Komprimierung)
- Erlaubte Typen: JPEG, PNG, WEBP
- Mindestens 1 Foto erforderlich

**Cascade**: Beim Löschen eines Reports werden alle zugehörigen Fotos gelöscht.

---

### 3. RoutingRule (Weiterleitungsregel)

Konfigurierbare Regeln für die automatische Weiterleitung.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | String (CUID) | ✓ | Interne ID |
| category | String | ✓ | Kategorie oder `*` für alle |
| district | String | ✓ | Bezirk oder `*` für alle |
| recipientEmail | String | ✓ | E-Mail der zuständigen Stelle |
| recipientName | String | ✓ | Name (z.B. "Straßenbauamt Mitte") |
| priority | Int | ✓ | Höhere Priorität = spezifischere Regel |
| isActive | Boolean | ✓ | Regel aktiv? |
| createdAt | DateTime | ✓ | Erstellungszeitpunkt |
| updatedAt | DateTime | ✓ | Letzte Änderung |

**Routing-Logik**:
1. Suche Regeln mit exaktem Match (category + district)
2. Falls nicht gefunden: category + `*` (beliebiger Bezirk)
3. Falls nicht gefunden: `*` + district (beliebige Kategorie)
4. Fallback: `*` + `*` (Zentrale)
5. Bei mehreren Matches: Höchste Priorität gewinnt

**Beispiel-Daten**:
```json
[
  { "category": "TRASH", "district": "*", "recipientEmail": "muell@stadt.de", "recipientName": "Müllabfuhr", "priority": 10 },
  { "category": "DAMAGE", "district": "Mitte", "recipientEmail": "strassenbau-mitte@stadt.de", "recipientName": "Straßenbauamt Mitte", "priority": 20 },
  { "category": "DAMAGE", "district": "*", "recipientEmail": "strassenbau@stadt.de", "recipientName": "Straßenbauamt Zentrale", "priority": 10 },
  { "category": "VANDALISM", "district": "*", "recipientEmail": "ordnungsamt@stadt.de", "recipientName": "Ordnungsamt", "priority": 10 },
  { "category": "*", "district": "*", "recipientEmail": "zentrale@stadt.de", "recipientName": "Bürgerbüro Zentrale", "priority": 0 }
]
```

---

### 4. AuditLog (Protokoll)

Unveränderliches Protokoll aller Aktionen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | String (CUID) | ✓ | Interne ID |
| reportId | String (FK) | ✓ | Referenz zu Report |
| action | Enum | ✓ | CREATED, FORWARDED, STATUS_CHANGED, REFORWARDED, DELETED |
| details | String (JSON) | ✓ | Aktionsspezifische Details |
| performedBy | String | ✓ | "system" oder Admin-ID |
| timestamp | DateTime | ✓ | Aktionszeitpunkt |

**Details-Schema je Action**:
```typescript
// CREATED
{ "category": "TRASH", "ticketId": "MU-20260114-A7K2X" }

// FORWARDED
{ "recipientEmail": "muell@stadt.de", "recipientName": "Müllabfuhr", "emailId": "msg-123" }

// STATUS_CHANGED
{ "oldStatus": "FORWARDED", "newStatus": "IN_PROGRESS" }

// REFORWARDED
{ "reason": "Neue E-Mail-Adresse", "recipientEmail": "muell-neu@stadt.de" }

// DELETED
{ "reason": "DSGVO-Anfrage", "deletedBy": "admin-123" }
```

---

### 5. Admin (Administrator)

Benutzer mit Backend-Zugriff.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | String (CUID) | ✓ | Interne ID |
| email | String (unique) | ✓ | Login-E-Mail |
| passwordHash | String | ✓ | bcrypt-Hash |
| name | String | ✓ | Anzeigename |
| role | Enum | ✓ | ADMIN (vollzugriff), VIEWER (nur lesen) |
| lastLoginAt | DateTime | ○ | Letzter Login |
| createdAt | DateTime | ✓ | Erstellungszeitpunkt |

**Rollen-Berechtigungen**:
| Aktion | ADMIN | VIEWER |
|--------|-------|--------|
| Meldungen anzeigen | ✓ | ✓ |
| Status ändern | ✓ | ✗ |
| Weiterleitung auslösen | ✓ | ✗ |
| Export | ✓ | ✓ |
| Routing-Regeln bearbeiten | ✓ | ✗ |

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// Bestehendes Model
model Message {
  id        Int      @id @default(autoincrement())
  text      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("messages")
}

// NEU: Mängelmelder Models

model Report {
  id              String    @id @default(cuid())
  ticketId        String    @unique
  category        Category
  status          Status    @default(SUBMITTED)
  latitude        Float
  longitude       Float
  address         String?
  district        String?
  comment         String
  urgency         Urgency   @default(MEDIUM)
  contactEmail    String?
  deviceId        String
  privacyAccepted Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  photos    Photo[]
  auditLogs AuditLog[]

  @@index([ticketId])
  @@index([status])
  @@index([category])
  @@index([district])
  @@index([createdAt])
  @@map("reports")
}

model Photo {
  id          String   @id @default(cuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  filename    String
  storagePath String
  mimeType    String
  size        Int
  createdAt   DateTime @default(now())

  @@index([reportId])
  @@map("photos")
}

model RoutingRule {
  id             String   @id @default(cuid())
  category       String   // Category enum value or "*"
  district       String   // District name or "*"
  recipientEmail String
  recipientName  String
  priority       Int      @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([category, district])
  @@map("routing_rules")
}

model AuditLog {
  id          String   @id @default(cuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  action      Action
  details     String   // JSON string
  performedBy String
  timestamp   DateTime @default(now())

  @@index([reportId])
  @@index([timestamp])
  @@map("audit_logs")
}

model Admin {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  role         Role      @default(VIEWER)
  lastLoginAt  DateTime?
  createdAt    DateTime  @default(now())

  @@map("admins")
}

// Enums

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

---

## Daten-Retention (DSGVO)

| Datentyp | Aufbewahrungsfrist | Löschlogik |
|----------|-------------------|------------|
| Report (Status: DONE) | 365 Tage nach Abschluss | Automatisch per Cron-Job |
| Photos | Mit Report | Cascade Delete |
| AuditLog | Mit Report | Cascade Delete |
| Admin | Unbegrenzt | Manuell |
| RoutingRule | Unbegrenzt | Manuell |

**Lösch-Cron** (täglich um 03:00):
```sql
DELETE FROM reports 
WHERE status = 'DONE' 
AND updatedAt < datetime('now', '-365 days');
```
