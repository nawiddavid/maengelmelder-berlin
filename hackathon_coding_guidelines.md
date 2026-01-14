# CURSOR_RULES.md (ultrakurz)

> **Zweck**: _Nur_ für AI‑Coding (Cursor/Copilot/Claude). Einfache, lokale Hackathon‑Projekte. **Lokal entwickeln & testen**, kein Deployment‑Zwang. Keine Over‑Engineering‑Diskussionen.

## 1) Rahmen/Constraints
- **Stack (Startpunkt)**: Node 20+, Express, ESM (`"type":"module"`).
- **Datenhaltung**: **SQLite als Default** (Datei `dev.db`). KI darf Alternativen vorschlagen (z. B. reines In‑Memory für triviale Demos, oder Postgres, _nur_ wenn ein **konkreter Nutzen** für den Hackathon entsteht). Entscheidung kurz begründen.
- **Lokal only**: Start via `npm run dev`; keine Cloud‑Pflicht. Deployments sind **außerhalb** des Scopes.
- **Dependencies**: Keine harten Verbote – **aber**: Neue Pakete/Nachrüstungen kurz begründen (1 Satz) und klein halten.
- **Dateien ändern**: In Prompts **explizit benennen** und nur diese anfassen.

## 2) Stil & Einfachheit
- **KISS**: Bevorzuge die _einfachste_ Lösung, die funktioniert.
- **Lesbarkeit**: Kurze Funktionen, sprechende Namen, früh return statt tiefer If‑Nesting.
- **Kommentare**: Nur _Warum_, nicht _Was_.
- **Antwortformat**: `{ data?, error? }` einheitlich.

## 3) Fehler & Logs
- 400 für Validierungsfehler, 404 wenn Ressource fehlt, 500 sonst.
- Globales Error‑Middleware. Logs mit Präfix (`[route]`, `[svc]`). Keine Secrets loggen.

## 4) Git‑Kleinstformat
- Kleine Commits/PRs. Branch: `feat/<kurz>`.
- PR‑Text: _Änderung_, _Warum_, _Wie testen_.

## 5) Was die KI **zuerst** liefern soll
1. **Plan**: Dateiliste + 1‑Satz‑Begründung je Datei.
2. **API‑Skizze**: Routen, Inputs, Fehlerfälle.
3. **Datenmodell**: SQLite‑Schema (SQL) + Migrationsschritt; ggf. Begründung bei abweichender DB‑Wahl.
4. **Mini‑Tests**: 1 Happy‑Path + 1 Fehlerfall (Vitest ok).
> Danach erst Implementierung **dateiweise**.

## 7) Definition of Done (knackig)
- Startet lokal (`npm run dev`).
- SQLite‑DB (`dev.db`) mit Migration erzeugt und genutzt.
- Mind. 1 Route + 1 Fehlerfall behandelt.
- `.env.example` gepflegt (falls ENV genutzt).
- README mit Start‑Hinweis (3 Zeilen).
- Keine Secrets committed.

