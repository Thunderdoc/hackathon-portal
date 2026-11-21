# Hackathon Portal

A hackathon management system — an event-registration portal with a web frontend and an Express backend. This repository is the deployment-shaped root for the project: the root script installs and builds the client and starts the server, and the server serves the built frontend in production.

> **Deployment status — unverified:** the previous README said "Deployed on Render" but gave no URL, and the repository contains no `render.yaml` (checked — not found). No live link is listed here until a working deployment URL is confirmed. Do not treat the old Render claim as current.

## What it is

- **Frontend (`client/`):** a Vite app (package name `event-registration-client`) using React Router, Axios, Recharts, QR codes (`react-qr-code`), PDF generation (`jspdf`, `html2canvas`), animations (`framer-motion`, `canvas-confetti`, `react-parallax-tilt`), and Lucide icons.
- **Backend (`server/`):** a Node.js / Express 5 API backed by SQLite (`sqlite3`), with file uploads (`multer`), CSV export (`csv-writer`, `csv-stringify`), and email via Brevo SMTP (`nodemailer`, configured from `EMAIL_USER` / `EMAIL_PASS` environment variables).
- **Data safety:** on startup the server copies `server/database.sqlite` to a timestamped backup under `server/backups/` when the database file exists.
- **Production serving:** the server serves the built frontend from `client/dist` and serves uploads from `/uploads`.

## Tech stack

| Layer | Technology (from the repo's own package files) |
| --- | --- |
| Frontend | Vite 7, `@vitejs/plugin-react`, React Router 7, Axios, Recharts, `react-qr-code`, `jspdf` + `html2canvas`, Framer Motion, Lucide React |
| Backend | Node.js ≥ 16, Express 5, SQLite 5, Multer, Nodemailer (Brevo SMTP), `cors`, `body-parser`, `dotenv` |
| Data | SQLite (`server/database.sqlite`), with timestamped backups in `server/backups/` |

## How to run

These commands come directly from the scripts in the repo's package files — nothing else is assumed.

```bash
# Install everything (root postinstall installs both client and server)
npm install

# Build the frontend (root build = build-client)
npm run build

# Start the server (root start = node server/index.js; server default port is 5001, or $PORT)
npm start
```

Individual pieces, from `client/package.json` and `server/package.json`:

```bash
npm run build --prefix client   # vite build
npm run dev --prefix client     # vite (development server)
node server/index.js            # same as npm start / server start script
```

Environment variables used by the server (see `server/index.js`): `PORT` (default `5001`), `EMAIL_USER`, `EMAIL_PASS` (Brevo SMTP credentials for outgoing email), `ADMIN_PASSWORD` (password for the seeded admin account — if unset, no admin account is created).

## Project structure

```
.
├── package.json          # root: install-all / build-client / start (node server/index.js)
├── client/               # Vite frontend (package: event-registration-client)
│   └── package.json      # dev / build / lint / preview scripts
└── server/               # Express + SQLite backend
    ├── index.js          # API server, static frontend serving, uploads, email, backups
    └── package.json      # start = node index.js
```

## Status and honesty notes

- This README describes only what was verified in the repo files listed above. It makes no claim about live users, events, awards, or metrics — none are stated in the code or package files checked.
- No screenshots are included, because none were verified in the repo for this README.
- Deployment: unverified (see the notice at the top). If a deployment URL is confirmed working, add it here as the live link.

Built by Thunderdoc
