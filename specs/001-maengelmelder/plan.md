# Implementation Plan: Mängelmelder

**Branch**: `001-maengelmelder` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-maengelmelder/spec.md`

---

## Summary

Der **Mängelmelder** ist eine mobile-first Webanwendung, die Bürger:innen ermöglicht, Probleme im öffentlichen Raum (Müll, Infrastrukturschäden, Vandalismus) schnell zu melden. Die Meldungen werden automatisch an die zuständige Stelle weitergeleitet. Die technische Umsetzung erfolgt als Erweiterung des bestehenden Express.js-Backends mit Prisma ORM und einem Vanilla-JS-Frontend im bestehenden Matrix-Design.

---

## Technical Context

**Language/Version**: Node.js ≥ 20.0.0, JavaScript (ES Modules)  
**Primary Dependencies**: Express.js 4.19.2, Prisma 5.20.0  
**Storage**: SQLite (dev.db) via Prisma ORM  
**Testing**: Vitest 1.3.1 + Supertest 7.1.4  
**Target Platform**: Web (Mobile-first, responsive)  
**Project Type**: Web Application (Monolith: Backend + Frontend in einem Projekt)  
**Performance Goals**: Formular-Ladezeit < 3s (3G), E-Mail-Versand < 5s  
**Constraints**: Max. 2MB Foto-Upload, Rate-Limit 5 Meldungen/Gerät/Stunde, Offline-Retry  
**Scale/Scope**: MVP für eine Kommune, ~1000 Meldungen/Monat erwartet

---

## Constitution Check

*GATE: Das Projekt hat keine spezifische Constitution definiert. Standard-Best-Practices gelten.*

| Prinzip | Status | Anmerkung |
|---------|--------|-----------|
| Einfachheit | ✅ | Monolith-Architektur, keine Microservices |
| Test-First | ✅ | Vitest bereits konfiguriert |
| Sicherheit | ✅ | Rate-Limiting, Input-Validierung, Datei-Upload-Sicherheit |
| DSGVO | ✅ | Datensparsamkeit, Löschkonzept, Privacy Notice |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-maengelmelder/
├── spec.md              # Feature-Spezifikation
├── plan.md              # Dieser Implementierungsplan
├── research.md          # Technische Research (bereits vorhanden)
├── data-model.md        # Datenmodell-Dokumentation
├── quickstart.md        # Schnellstart-Anleitung
├── checklists/
│   └── requirements.md  # Qualitäts-Checkliste
└── contracts/
    └── openapi.yaml     # API-Contract (OpenAPI 3.0)
```

### Source Code (repository root)

```text
/
├── public/                          # Frontend (statische Dateien)
│   ├── index.html                   # Landing Page (erweitern)
│   ├── report.html                  # Meldung erstellen (NEU)
│   ├── status.html                  # Status abfragen (NEU)
│   ├── admin/                       # Admin-Bereich (NEU)
│   │   ├── index.html               # Admin Dashboard
│   │   └── login.html               # Admin Login
│   ├── js/                          # JavaScript-Module (NEU)
│   │   ├── report.js                # Meldungsformular-Logik
│   │   ├── map.js                   # Leaflet Karten-Integration
│   │   ├── camera.js                # Kamera/Upload-Handling
│   │   ├── status.js                # Status-Abfrage
│   │   └── admin.js                 # Admin-Dashboard-Logik
│   ├── styles.css                   # Bestehendes Matrix-Theme (erweitern)
│   └── app.js                       # Bestehende Frontend-Logik
│
├── src/                             # Backend
│   ├── app.js                       # Express-App (erweitern)
│   ├── server.js                    # Server-Einstiegspunkt
│   ├── db.js                        # Prisma-Client
│   ├── logger.js                    # Logging
│   │
│   ├── routes/                      # API-Routen
│   │   ├── reports.route.js         # /api/reports/* (NEU)
│   │   ├── admin.route.js           # /api/admin/* (NEU)
│   │   └── auth.route.js            # /api/auth/* (NEU)
│   │
│   ├── services/                    # Business-Logik
│   │   ├── report.service.js        # Meldungsverwaltung (NEU)
│   │   ├── routing.service.js       # Weiterleitungslogik (NEU)
│   │   ├── email.service.js         # E-Mail-Versand (NEU)
│   │   └── geocoding.service.js     # Reverse Geocoding (NEU)
│   │
│   ├── repositories/                # Datenbank-Zugriff
│   │   ├── report.repository.js     # Report CRUD (NEU)
│   │   ├── routing.repository.js    # RoutingRule CRUD (NEU)
│   │   └── admin.repository.js      # Admin CRUD (NEU)
│   │
│   ├── middlewares/                 # Express-Middleware
│   │   ├── rate-limit.js            # Rate-Limiting (NEU)
│   │   ├── upload.js                # Multer File-Upload (NEU)
│   │   ├── auth.js                  # Admin-Authentifizierung (NEU)
│   │   └── validation.js            # Input-Validierung (NEU)
│   │
│   └── utils/                       # Hilfsfunktionen
│       ├── ticket-id.js             # Ticket-ID-Generator (NEU)
│       └── image-compress.js        # Serverseitige Bildprüfung (NEU)
│
├── uploads/                         # Foto-Speicher (gitignore, NEU)
│
├── prisma/
│   └── schema.prisma                # Datenbank-Schema (erweitern)
│
└── tests/
    ├── reports.test.js              # Report-API-Tests (NEU)
    ├── routing.test.js              # Routing-Logik-Tests (NEU)
    └── admin.test.js                # Admin-API-Tests (NEU)
```

**Structure Decision**: Erweiterung des bestehenden Monolith-Setups. Backend und Frontend in einem Projekt, statische Dateien über Express ausgeliefert. Keine separate Build-Pipeline für Frontend (Vanilla JS).

---

## Neue Dependencies

```bash
# Production
npm install multer nodemailer express-rate-limit express-session bcrypt uuid express-validator

# Leaflet als CDN im Frontend (kein npm nötig)
```

| Paket | Version | Zweck |
|-------|---------|-------|
| multer | ^1.4.5 | Multipart File-Upload |
| nodemailer | ^6.9.x | E-Mail-Versand |
| express-rate-limit | ^7.x | Rate-Limiting |
| express-session | ^1.18.x | Session-Management für Admin |
| bcrypt | ^5.1.x | Passwort-Hashing |
| uuid | ^9.x | UUID-Generierung |
| express-validator | ^7.x | Input-Validierung |

---

## Implementierungsphasen

### Phase 1: Datenbank & Core-Services (Backend)
**Geschätzte Dauer**: 2-3 Stunden

1. Prisma-Schema erweitern (Report, Photo, RoutingRule, AuditLog, Admin)
2. Migrations ausführen
3. Repository-Layer implementieren
4. Ticket-ID-Generator erstellen

### Phase 2: Meldungs-API (Backend)
**Geschätzte Dauer**: 3-4 Stunden

1. File-Upload-Middleware (Multer)
2. Rate-Limiting-Middleware
3. Validierungs-Middleware
4. POST /api/reports - Meldung erstellen
5. GET /api/reports/:ticketId - Status abfragen
6. Tests schreiben

### Phase 3: Routing & E-Mail (Backend)
**Geschätzte Dauer**: 2-3 Stunden

1. Routing-Service (Kategorie + Bezirk → Empfänger)
2. E-Mail-Service (Nodemailer)
3. AuditLog-Erstellung
4. Geocoding-Service (Nominatim/OSM)

### Phase 4: Admin-API (Backend)
**Geschätzte Dauer**: 2-3 Stunden

1. Auth-Middleware (Session + bcrypt)
2. GET /api/admin/reports - Liste mit Filtern
3. PATCH /api/admin/reports/:id - Status ändern
4. POST /api/admin/reports/:id/reforward - Erneut weiterleiten
5. GET /api/admin/export - CSV/JSON Export

### Phase 5: Meldungsformular (Frontend)
**Geschätzte Dauer**: 4-5 Stunden

1. report.html - Mehrstufiges Formular
2. Kategorieauswahl (4 Kacheln)
3. Kamera/Upload-Integration
4. Leaflet-Karte mit GPS + Pin-Korrektur
5. Kommentar + optionale Felder
6. Fortschrittsanzeige (Stepper)
7. Bestätigungsseite

### Phase 6: Status & Admin (Frontend)
**Geschätzte Dauer**: 2-3 Stunden

1. status.html - Ticket-ID-Eingabe + Status-Anzeige
2. admin/login.html - Login-Formular
3. admin/index.html - Dashboard mit Filtern
4. Export-Buttons

### Phase 7: Styling & Accessibility
**Geschätzte Dauer**: 2-3 Stunden

1. Matrix-Theme erweitern für neue Komponenten
2. Mobile-Optimierung (Touch-Ziele 48px+)
3. ARIA-Labels, Screenreader-Support
4. Kontrast-Prüfung

---

## Risiken & Mitigationen

| Risiko | Wahrscheinlichkeit | Mitigation |
|--------|-------------------|------------|
| SMTP-Konfiguration | Mittel | Fallback: Console-Log für Demo |
| GPS ungenau | Hoch | Karten-Pin-Korrektur implementiert |
| Große Bilder | Mittel | Client-Side Komprimierung |
| SQLite bei Last | Niedrig | Monitoring, bei Bedarf PostgreSQL |

---

## Complexity Tracking

Keine Verstöße gegen Best Practices. Einfache Architektur beibehalten.

---

## Nächster Schritt

Nach Abschluss dieses Plans: **`/speckit.tasks`** ausführen, um detaillierte Aufgaben zu generieren.
