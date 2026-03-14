# DocEU26 - European Office Suite

## Project Overview

European-driven Office 365 alternative. Full suite: Docs, Sheets, Slides, Email, Calendar, Drive, Chat (Agora).
Web-first, with desktop (Tauri v2) and mobile planned.

## Monorepo Structure

```
apps/
  web/          — React 19 + Vite frontend (main app)
  desktop/      — Tauri v2 desktop wrapper (do NOT build in CI)
  storybook/    — Component playground
packages/
  ui/           — Design system (Radix Primitives + CVA)
  editor-core/  — Custom document editor engine
  collab/       — Yjs CRDT collaboration layer
  crypto/       — Client-side encryption (AES, X25519)
  sheets-engine/— Spreadsheet formula engine
  slides-engine/— Slide renderer
  auth/         — Auth client helpers
  api-client/   — API client
  i18n/         — Internationalization
  shared/       — Shared types/utils
services/       — Go microservices (go.work workspace)
  auth/         — Authentication (JWT, bcrypt, in-memory store)
  chat/         — WebSocket chat + WebRTC signaling (Agora)
  collab/       — Document collaboration server
  document/     — Document CRUD
  storage/      — File storage (local provider)
  email/        — Email service
  calendar/     — Calendar service
  gateway/      — API gateway
  notification/ — Notifications
  search/       — Meilisearch integration
  audit/        — Audit logging
  shared/       — Shared Go packages (middleware, config, providers)
infra/
  docker/       — Docker Compose (postgres, redis, nats, meilisearch)
  nginx/        — Nginx reverse proxy config
proto/          — Protobuf definitions
```

## Tech Stack

- **Frontend:** React 19, TypeScript 5.7+, Vite 6, Tailwind CSS v4
- **State:** Zustand (global), Jotai (editor), Yjs (collaboration)
- **UI:** Custom design system on Radix Primitives
- **Backend:** Go 1.24 microservices
- **DB:** PostgreSQL 17, Redis 7, NATS JetStream, Meilisearch
- **Auth:** JWT + bcrypt (in-memory store currently)
- **Desktop:** Tauri v2
- **Package manager:** pnpm 9.15.0 (set in packageManager field)
- **Monorepo:** Turborepo

## Development

```bash
pnpm install                          # install all deps
pnpm turbo run build                  # build all packages
cd apps/web && pnpm vite dev          # run web dev server
cd services/auth && go run ./cmd/server/   # run auth service
cd services/chat && go run ./cmd/server/   # run chat service
```

### Go services

All Go services live under `services/` and use a `go.work` workspace. Each service is an independent module. Build individually:
```bash
cd services/chat && go build ./cmd/server/
```

Do NOT run `go build ./...` from the `services/` root — it doesn't work with go.work. Iterate modules individually.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push to `main`:

1. **Frontend job:** typecheck + build (excludes `@doceu26/desktop`)
2. **Backend job:** build + test + vet each Go module
3. **Deploy job:** builds frontend + Go binaries, deploys to EC2 via SSH

### Deployment target

- **EC2 instance:** `3.75.246.92` (eu-central-1)
- **SSH:** `ssh -i ~/.ssh/doceu26-prod.pem ec2-user@3.75.246.92`
- **Frontend:** static files at `/var/www/doceu26/` served by nginx
- **Services:** binaries at `/opt/doceu26/bin/`, managed by systemd
- **Infrastructure:** Docker containers (postgres, redis, nats, meilisearch)
- **GitHub secrets:** `EC2_SSH_KEY`, `EC2_HOST`

### Deploy notes

- Services must be stopped before overwriting binaries (Text file busy)
- Frontend rsync needs `--rsync-path="sudo rsync"` (root-owned dir)
- Desktop/Tauri is excluded from CI (needs native deps, causes recursive build)

## Seed Users

Auth service seeds two users on startup:

| Email | Password | Role |
|---|---|---|
| `karel@doceu26.eu` | `DocEU26!` | admin |
| `demo@doceu26.eu` | `DocEU26!` | member |

## Key Conventions

- Never run API servers directly — tell the user how to run them
- Frontend builds: `cd apps/web && pnpm vite build` (turbo has issues locally without packageManager)
- Go cross-compile for EC2: `GOOS=linux GOARCH=amd64 go build -o <name> ./cmd/server/`
- Chat/video calls use WebRTC with WebSocket signaling through the chat service
- The web app is responsive (mobile-first for Agora/chat features)
