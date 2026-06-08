# Prototyp Indoor Navigation

Ein webbasierter Indoor-Navigations-Prototyp — hilft Nutzern, sich in Gebäuden mithilfe einer interaktiven kartenbasierten Oberfläche zurechtzufinden. Gedacht für Umgebungen wie Bürogebäude, Krankenhäuser oder Messehallen, in denen GPS nicht zuverlässig funktioniert.

Entwickelt mit Vue 3 und getestet mit Vitest.

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Vue 3 (Composition API) |
| Build-Tool | Vite |
| Sprache | JavaScript |
| Code-Qualität | Prettier |

---

## Features

- Interaktive Gebäudekarte mit Raum- und Bereichsvisualisierung
- Navigationsrouting zwischen Punkten (POIs)
- Suche nach Räumen, Personen oder Einrichtungen
- Responsives Layout für Desktop und Tablet

---

## Projektstruktur

```
probably-a-naphigation/
├── src/
│   ├── components/    # UI- und Kartenkomponenten
│   ├── views/         # Seiten-Komponenten
│   ├── assets/        # Grundrisspläne und Icons
│   └── main.js        # App-Einstiegspunkt
├── public/
├── index.html
├── vite.config.js
```

---

## Schnellstart

### Voraussetzungen

- Node.js 18+

### Lokale Einrichtung

```bash
# Repository klonen
git clone https://github.com/anmink/probably-a-naphigation.git
cd probably-a-naphigation

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App läuft unter `http://localhost:5173`.

### Produktions-Build

```bash
npm run build
```

---

## Status

Prototyp / Explorationsprojekt. Der Repo-Name ist eine spielerische Anspielung auf die Unsicherheit, sich in unbekannten Gebäuden zurechtzufinden.
