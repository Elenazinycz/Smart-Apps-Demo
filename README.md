# Smart-Apps-Demo — Praxis-Terminsoftware

Online-Terminbuchung fuer die Gemeinschaftspraxis Demir & Kollegen (Digital
Business, HTW Berlin). Patient:innen buchen, stornieren und verschieben
online buchbare Termintypen (Vorsorge, Beratung, Impfung,
Wiederholungsrezept-Abholung) selbst; Akut, Blutabnahme und Erstgespraech
bleiben telefonisch/vor Ort. MFAs verwalten Sprechzeiten, Sperrzeiten,
Akutslots und No-Show-Sperren; Aerzt:innen pflegen ihre eigenen Urlaube.

Details zu Anforderungen, Business Rules und Datenmodell: [`docs/spec.md`](docs/spec.md).

## Setup

Voraussetzungen: Node.js (siehe `package.json`), npm.

```bash
npm install
cp .env.example .env      # DATABASE_URL und JWT_SECRET anpassen
npx prisma generate
npx prisma migrate dev
npx prisma db seed        # Testdaten (Ärzt:innen, Patient:innen, Slots)
npm run dev
```

## Nuetzliche Scripts

| Befehl | Zweck |
|---|---|
| `npm run dev` | Dev-Server |
| `npm run build` / `npm run start` | Produktions-Build/-Start |
| `npm run lint` | ESLint |
| `npm run prisma:studio` | DB-Browser (Prisma Studio) |

## KI-Einsatz

Bei der Entwicklung wurde KI-Unterstuetzung genutzt (Codex aus dem KI Pool des Kurses). Details zu Arbeitsweise und
Entscheidungen: [`docs/modus-operandi.md`](docs/modus-operandi.md),
[`docs/decisions.md`](docs/decisions.md).

## Kalibrierung

Siehe [`KALIBRIERUNG.md`](KALIBRIERUNG.md) im Repo-Root.

## Weitere Doku

Siehe [`docs/README.md`](docs/README.md) fuer den vollstaendigen
Dokumentationsindex (Spec, Architektur, Backlog, Entscheidungen).
