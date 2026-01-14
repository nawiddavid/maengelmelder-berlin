# Feature Specification: Mängelmelder

**Feature Branch**: `001-maengelmelder`  
**Created**: 2026-01-14  
**Status**: Draft  
**Input**: Niedrigschwellige Melde-App für Bürger:innen zur schnellen Meldung von Problemen im öffentlichen Raum

---

## Übersicht

Der **Mängelmelder** ist eine mobile-first Webanwendung, die es Bürger:innen ermöglicht, Probleme im öffentlichen Raum (Müll, Infrastrukturschäden, Vandalismus) in 30–60 Sekunden zu melden. Die Meldungen werden automatisch an die zuständige Stelle (Müllabfuhr, Straßenbauamt, Grünflächenamt, Ordnungsamt) weitergeleitet.

### Kernprinzipien
- **Schnell**: Meldung in unter 60 Sekunden
- **Einfach**: Keine Registrierung erforderlich
- **Barrierefrei**: Große Buttons, kontrastreich, Screenreader-freundlich
- **Datensparend**: DSGVO-konform, minimale Datenerhebung

---

## User Scenarios & Testing

### User Story 1 - Müll melden (Priority: P1)

Als Bürger:in möchte ich Müll an einer Straßenecke melden können, indem ich ein Foto mache, meinen Standort automatisch übernehme, einen kurzen Kommentar schreibe und die Meldung abschicke.

**Why this priority**: Dies ist der häufigste Anwendungsfall. Wenn Bürger:innen schnell und unkompliziert Müll melden können, wird das Hauptziel der App erreicht.

**Independent Test**: Kann vollständig getestet werden durch das Erstellen einer Meldung mit Foto + GPS + Kommentar und Erhalt einer Ticket-ID.

**Acceptance Scenarios**:

1. **Given** ich bin auf der Startseite der App, **When** ich "Neue Meldung" tippe, **Then** sehe ich die Kategorieauswahl (Müll, Schäden, Vandalismus, Sonstiges)

2. **Given** ich habe "Müll" als Kategorie gewählt, **When** ich auf "Foto aufnehmen" tippe, **Then** öffnet sich die Kamera meines Geräts

3. **Given** ich habe ein Foto aufgenommen, **When** das Foto angezeigt wird, **Then** sehe ich eine Vorschau mit der Option "Behalten" oder "Neu aufnehmen"

4. **Given** ich habe ein Foto und Kategorie ausgewählt, **When** ich zum Standort-Schritt komme, **Then** wird mein GPS-Standort automatisch auf einer Karte angezeigt mit einem verschiebbaren Pin

5. **Given** alle Pflichtfelder sind ausgefüllt (Foto, Standort, Kommentar ≤500 Zeichen), **When** ich auf "Meldung absenden" tippe, **Then** erhalte ich eine Bestätigung mit Ticket-ID

6. **Given** die Meldung wurde erfolgreich gesendet, **When** die Bestätigungsseite angezeigt wird, **Then** sehe ich die Ticket-ID, eine Zusammenfassung meiner Meldung und einen Link zum Statusabruf

---

### User Story 2 - Standort korrigieren bei Infrastrukturschaden (Priority: P1)

Als Bürger:in möchte ich einen Schaden (z.B. kaputte Laterne) melden und dabei den automatisch erkannten Standort auf der Karte manuell korrigieren können.

**Why this priority**: GPS ist nicht immer präzise. Die Möglichkeit zur Feinjustierung ist essentiell für die korrekte Weiterleitung.

**Independent Test**: Kann getestet werden durch Verschieben des Karten-Pins und Verifizierung der gespeicherten Koordinaten.

**Acceptance Scenarios**:

1. **Given** ich bin im Standort-Schritt, **When** mein GPS-Standort nicht exakt ist, **Then** kann ich den Pin auf der Karte per Drag & Drop verschieben

2. **Given** ich habe den Pin verschoben, **When** ich loslasse, **Then** werden die neuen Koordinaten übernommen und die Adresse aktualisiert sich

3. **Given** GPS ist nicht verfügbar, **When** ich zum Standort-Schritt komme, **Then** kann ich manuell eine Adresse eingeben oder auf der Karte suchen

---

### User Story 3 - Status abrufen mit Ticket-ID (Priority: P2)

Als Bürger:in möchte ich den Status meiner Meldung jederzeit über meine Ticket-ID abrufen können, ohne mich anmelden zu müssen.

**Why this priority**: Transparenz schafft Vertrauen. Bürger:innen wollen wissen, ob ihre Meldung bearbeitet wird.

**Independent Test**: Kann getestet werden durch Eingabe einer bekannten Ticket-ID und Anzeige des korrekten Status.

**Acceptance Scenarios**:

1. **Given** ich bin auf der Startseite, **When** ich "Status prüfen" wähle und meine Ticket-ID eingebe, **Then** sehe ich den aktuellen Status meiner Meldung

2. **Given** meine Meldung hat Status "Weitergeleitet", **When** ich den Status abrufe, **Then** sehe ich welche Stelle zuständig ist und wann die Weiterleitung erfolgte

3. **Given** ich habe bei der Meldung meine E-Mail angegeben, **When** sich der Status ändert, **Then** erhalte ich eine E-Mail-Benachrichtigung

---

### User Story 4 - Admin: Meldungen verwalten (Priority: P2)

Als Admin möchte ich alle Meldungen nach Bezirk, Status und Kategorie filtern können, um einen Überblick zu behalten und Status zu aktualisieren.

**Why this priority**: Ohne Admin-Funktionalität können Meldungen nicht verwaltet und Status nicht aktualisiert werden.

**Independent Test**: Kann getestet werden durch Einloggen als Admin, Filtern nach Bezirk und Ändern eines Status.

**Acceptance Scenarios**:

1. **Given** ich bin als Admin eingeloggt, **When** ich die Meldungsliste öffne, **Then** sehe ich alle Meldungen mit Ticket-ID, Kategorie, Status, Datum und Bezirk

2. **Given** ich bin in der Meldungsliste, **When** ich nach "Status: Eingereicht" und "Bezirk: Mitte" filtere, **Then** werden nur passende Meldungen angezeigt

3. **Given** ich habe eine Meldung geöffnet, **When** ich den Status von "Weitergeleitet" auf "In Bearbeitung" ändere, **Then** wird der Status gespeichert und im Audit-Log protokolliert

4. **Given** ich bin in der Detailansicht, **When** ich "Weiterleitung erneut auslösen" klicke, **Then** wird eine neue E-Mail an die zuständige Stelle gesendet

---

### User Story 5 - Zuständige Stelle: E-Mail empfangen (Priority: P1)

Als zuständige Stelle (z.B. Straßenbauamt) möchte ich strukturierte Meldungen per E-Mail erhalten, um diese effizient bearbeiten zu können.

**Why this priority**: Ohne die Weiterleitung an die zuständige Stelle hat die App keinen praktischen Nutzen.

**Independent Test**: Kann getestet werden durch Absenden einer Meldung und Prüfen des E-Mail-Eingangs.

**Acceptance Scenarios**:

1. **Given** eine Meldung wurde abgesendet, **When** das Routing "Kategorie: Schäden" + "Bezirk: Mitte" ergibt "Straßenbauamt", **Then** erhält das Straßenbauamt eine E-Mail

2. **Given** die E-Mail wurde versendet, **When** ich sie öffne, **Then** enthält sie: Ticket-ID, Kategorie, Foto(s), Kartenlink, Koordinaten, Kommentar, Zeitstempel und Kontakt (falls angegeben)

---

### User Story 6 - Mehrere Fotos und Dringlichkeit (Priority: P3)

Als Bürger:in möchte ich optional bis zu 3 Fotos hochladen und die Dringlichkeit angeben können.

**Why this priority**: Nice-to-have für detailliertere Meldungen, aber nicht MVP-kritisch.

**Independent Test**: Kann getestet werden durch Hochladen von 3 Fotos und Auswahl der Dringlichkeit "Hoch".

**Acceptance Scenarios**:

1. **Given** ich habe ein Pflichtfoto aufgenommen, **When** ich "Weiteres Foto hinzufügen" tippe, **Then** kann ich bis zu 2 weitere Fotos hinzufügen

2. **Given** ich bin im letzten Schritt vor dem Absenden, **When** ich die Dringlichkeit auf "Hoch" setze, **Then** wird dies in der Meldung gespeichert und in der E-Mail hervorgehoben

---

### User Story 7 - Offline-Fähigkeit / Retry (Priority: P3)

Als Bürger:in möchte ich meine Meldung auch bei schlechter Netzverbindung erstellen können.

**Why this priority**: Verbessert UX in Gebieten mit schlechtem Empfang, aber nicht MVP-kritisch.

**Independent Test**: Kann getestet werden durch Erstellen einer Meldung im Offline-Modus und Verifizierung des automatischen Uploads bei Netzwerkwiederherstellung.

**Acceptance Scenarios**:

1. **Given** ich habe eine Meldung erstellt, **When** das Netzwerk nicht verfügbar ist, **Then** wird die Meldung lokal gespeichert und ich erhalte einen Hinweis

2. **Given** eine Meldung ist lokal gespeichert, **When** das Netzwerk wieder verfügbar ist, **Then** wird die Meldung automatisch gesendet

---

### Edge Cases

- **Kein GPS**: Fallback auf manuelle Adresseingabe / Kartensuche
- **Kamera-Berechtigung verweigert**: Hinweis mit Erklärung + Option zum Datei-Upload
- **Foto zu groß**: Automatische Komprimierung auf max. 2MB
- **Spam-Erkennung**: Rate-Limit von 5 Meldungen pro Gerät pro Stunde
- **Ungültige Ticket-ID**: Klare Fehlermeldung "Ticket nicht gefunden"
- **E-Mail-Versand fehlgeschlagen**: Retry-Mechanismus + Admin-Benachrichtigung
- **Bezirk nicht ermittelbar**: Fallback auf "Zentrale" als Standardempfänger

---

## Requirements

### Functional Requirements

#### Meldung erstellen
- **FR-001**: System MUSS eine Kategorieauswahl bieten: Müll, Schäden an Infrastruktur, Vandalismus, Sonstiges
- **FR-002**: System MUSS Fotoaufnahme via Gerätekamera ermöglichen
- **FR-003**: System MUSS Foto-Upload aus Galerie ermöglichen als Alternative
- **FR-004**: System MUSS Fotos auf max. 2MB komprimieren vor Upload
- **FR-005**: System MUSS GPS-Standort automatisch erfassen (mit Berechtigung)
- **FR-006**: System MUSS eine interaktive Karte mit verschiebbarem Pin zeigen
- **FR-007**: System MUSS ein Kommentarfeld (max. 500 Zeichen) bereitstellen
- **FR-008**: System MUSS optionale Felder unterstützen: weitere Fotos (bis 3), Dringlichkeit, E-Mail
- **FR-009**: System DARF Meldung nicht absenden ohne: 1 Foto, Standort, Kategorie, Kommentar

#### Validierung & Spam-Schutz
- **FR-010**: System MUSS Plausibilitätsprüfung durchführen vor Submit
- **FR-011**: System MUSS Rate-Limiting implementieren (max. 5 Meldungen/Gerät/Stunde)
- **FR-012**: System MUSS einfachen Bot-Schutz implementieren (z.B. Honeypot oder reCAPTCHA)
- **FR-013**: System MUSS Datenschutzhinweis anzeigen vor Submit

#### Weiterleitung
- **FR-014**: System MUSS Meldungen basierend auf Kategorie + Bezirk routen
- **FR-015**: System MUSS Routing-Regeln konfigurierbar speichern (JSON/Datenbank)
- **FR-016**: System MUSS E-Mail an zuständige Stelle senden mit strukturierten Daten
- **FR-017**: System MUSS eindeutige Ticket-ID generieren (Format: MM-YYYYMMDD-XXXXX)

#### Status & Nachverfolgung
- **FR-018**: System MUSS Status-Workflow unterstützen: Eingereicht → Weitergeleitet → In Bearbeitung → Erledigt
- **FR-019**: System MUSS Status-Abfrage per Ticket-ID ohne Login ermöglichen
- **FR-020**: System SOLL E-Mail-Benachrichtigung bei Statusänderung senden (wenn E-Mail angegeben)

#### Admin-Backend
- **FR-021**: System MUSS Admin-Login mit Authentifizierung bereitstellen
- **FR-022**: System MUSS Meldungsliste mit Filtern (Status, Kategorie, Bezirk, Zeitraum) zeigen
- **FR-023**: System MUSS Detailansicht mit allen Meldungsdaten bereitstellen
- **FR-024**: System MUSS Admin-Funktion zum Status-Ändern bereitstellen
- **FR-025**: System MUSS Admin-Funktion zum erneuten Auslösen der Weiterleitung bereitstellen
- **FR-026**: System MUSS Audit-Log führen (wann, was, wohin)
- **FR-027**: System MUSS Export als CSV/JSON ermöglichen

### Non-Functional Requirements

#### DSGVO & Datenschutz
- **NFR-001**: System MUSS Datenschutzerklärung vor erster Nutzung anzeigen
- **NFR-002**: System MUSS Einwilligung zur Datenverarbeitung einholen
- **NFR-003**: System MUSS Meldungen nach konfigurierbarer Frist löschen (Default: 365 Tage)
- **NFR-004**: System DARF keine personenbezogenen Daten unnötig speichern

#### Sicherheit
- **NFR-005**: System MUSS alle API-Endpunkte gegen unbefugten Schreibzugriff schützen
- **NFR-006**: System MUSS Uploads sicher speichern (nicht direkt ausführbar)
- **NFR-007**: System MUSS Admin-Bereich mit Authentifizierung schützen
- **NFR-008**: System MUSS HTTPS für alle Verbindungen verwenden

#### Performance & Verfügbarkeit
- **NFR-009**: Meldungsformular MUSS in unter 3 Sekunden laden (3G-Netz)
- **NFR-010**: Foto-Upload MUSS Fortschrittsanzeige haben
- **NFR-011**: System MUSS bei Netzwerkfehlern sinnvolle Retry-Logik implementieren
- **NFR-012**: System MUSS klare Fehlermeldungen bei Problemen zeigen

#### Accessibility
- **NFR-013**: UI MUSS WCAG 2.1 Level AA erfüllen
- **NFR-014**: Alle interaktiven Elemente MÜSSEN min. 44x44px Touch-Ziel haben
- **NFR-015**: Farbkontrast MUSS mindestens 4.5:1 sein
- **NFR-016**: Alle Bilder MÜSSEN Alt-Texte haben
- **NFR-017**: Formular MUSS mit Screenreader bedienbar sein

#### Internationalisierung
- **NFR-018**: System SOLL i18n-fähig sein mit Deutsch als Default

---

## Key Entities

### Report (Meldung)
Die zentrale Entität für eine Bürger-Meldung.

| Attribut | Beschreibung |
|----------|--------------|
| ticketId | Eindeutige ID (MM-YYYYMMDD-XXXXX) |
| category | Kategorie: TRASH, DAMAGE, VANDALISM, OTHER |
| status | Status: SUBMITTED, FORWARDED, IN_PROGRESS, DONE |
| photos | Array von Foto-URLs (1-3) |
| location | GPS-Koordinaten (lat, lng) |
| address | Adresse (aus Geocoding) |
| district | Bezirk (für Routing) |
| comment | Kommentar (max. 500 Zeichen) |
| urgency | Dringlichkeit: LOW, MEDIUM, HIGH (optional) |
| contactEmail | E-Mail für Updates (optional) |
| deviceId | Anonyme Geräte-ID (für Rate-Limiting) |
| createdAt | Erstellungszeitpunkt |
| updatedAt | Letzte Änderung |

### RoutingRule (Weiterleitungsregel)
Definiert, welche Stelle für welche Kombination zuständig ist.

| Attribut | Beschreibung |
|----------|--------------|
| id | Eindeutige ID |
| category | Kategorie oder "*" für alle |
| district | Bezirk oder "*" für alle |
| recipientEmail | E-Mail der zuständigen Stelle |
| recipientName | Name der Stelle (z.B. "Straßenbauamt Mitte") |
| priority | Priorität bei mehreren Matches |

### AuditLog (Protokoll)
Protokolliert alle Aktionen für Nachvollziehbarkeit.

| Attribut | Beschreibung |
|----------|--------------|
| id | Eindeutige ID |
| reportId | Referenz zur Meldung |
| action | Aktion: CREATED, FORWARDED, STATUS_CHANGED, REFORWARDED |
| details | JSON mit Details (alter/neuer Status, Empfänger) |
| performedBy | "system" oder Admin-ID |
| timestamp | Zeitpunkt |

### Admin (Administrator)
Benutzer mit Zugriff auf das Backend.

| Attribut | Beschreibung |
|----------|--------------|
| id | Eindeutige ID |
| email | E-Mail (Login) |
| passwordHash | Gehashtes Passwort |
| name | Anzeigename |
| role | Rolle: ADMIN, VIEWER |
| createdAt | Erstellungszeitpunkt |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Bürger:innen können eine Meldung in unter 60 Sekunden erstellen (gemessen vom Öffnen bis Submit)
- **SC-002**: 95% der Meldungen werden innerhalb von 2 Minuten an die zuständige Stelle weitergeleitet
- **SC-003**: Formular ist auf Mobilgeräten ohne horizontales Scrollen nutzbar (320px bis 428px Breite)
- **SC-004**: Lighthouse Accessibility Score ≥ 90
- **SC-005**: Lighthouse Performance Score ≥ 80 (mobil, 3G)
- **SC-006**: Uptime ≥ 99% während Betriebsstunden
- **SC-007**: Fehlerrate bei E-Mail-Versand < 1%

### MVP Definition of Done

- [ ] Meldung kann ohne Login erstellt werden
- [ ] Foto + Standort + Kommentar sind Pflichtfelder
- [ ] Kategorieauswahl funktioniert
- [ ] Standort-Karte mit Pin-Korrektur funktioniert
- [ ] Ticket-ID wird generiert und angezeigt
- [ ] E-Mail wird an zuständige Stelle gesendet
- [ ] Status-Abfrage per Ticket-ID funktioniert
- [ ] Admin kann Meldungen einsehen und Status ändern
- [ ] Rate-Limiting ist aktiv
- [ ] DSGVO-Hinweis wird angezeigt
- [ ] Responsive Design funktioniert auf Mobile

---

## UI/UX Guidelines

### Farbschema (Matrix-inspiriert für das aktuelle Theme)
- Primary: `#00aa35` (Matrix-Grün)
- Background: `#0a0a12` (Dunkel)
- Surface: `#12121f` (Karten)
- Text Primary: `#00ff41` (Hell-Grün)
- Text Secondary: `#009930` (Gedämpftes Grün)
- Error: `#ff4444`
- Success: `#00ff41`

### Mobile-First Design
- Max. 3-4 Taps bis zum Submit
- Große Buttons (min. 48px Höhe)
- Klare Fortschrittsanzeige (Stepper: 1→2→3→✓)
- Kein horizontales Scrollen
- Sticky "Weiter"/"Absenden" Button am unteren Rand

### Formular-Schritte
1. **Kategorie** - 4 große Kacheln
2. **Foto** - Kamera + Upload-Option
3. **Standort** - Karte mit Pin
4. **Details** - Kommentar + optionale Felder
5. **Bestätigung** - Zusammenfassung vor Submit

---

## Out of Scope (MVP)

- Native Apps (iOS/Android) - nur Web
- Mehrsprachigkeit (nur Deutsch im MVP)
- Komplexe Workflows (Zuweisung an Bearbeiter)
- Öffentliche Statistiken/Dashboard
- Social Features (Likes, Kommentare)
- Integration mit externen Systemen (außer E-Mail)
- Push-Notifications
