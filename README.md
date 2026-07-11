# AI Productivity Hub

Enterprise-grade AI-powered productivity SaaS platform.

## Monorepo Structure

```
ai-productivity-hub/
├── apps/
│   ├── backend/        # NestJS API (Clean Architecture)
│   └── frontend/        # Angular 20 (Standalone Components + Signals)
├── docker-compose.yml
├── .github/workflows/   # CI/CD
└── README.md
```

## Tech Stack

**Frontend:** Angular 20, TypeScript, Angular Material, RxJS, Signals, SCSS, Standalone Components
**Backend:** NestJS, Node.js, REST + WebSocket, JWT, Swagger
**Database:** PostgreSQL, Redis, Elasticsearch
**Storage:** AWS S3
**Deployment:** Docker, Nginx, GitHub Actions, AWS

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Local development

```bash
# 1. Start infrastructure (Postgres, Redis, Elasticsearch)
docker compose up -d postgres redis elasticsearch

# 2. Backend
cd apps/backend
npm install
cp .env.example .env
npm run start:dev
# API: http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs

# 3. Frontend
cd apps/frontend
npm install
npm start
# App: http://localhost:4200
```

### Full stack via Docker

```bash
docker compose up --build
```

## Architecture

### Backend (Clean Architecture)
Each feature module follows: **Controller → Service → Repository → Entity**, with DTOs for
validation at the boundary. Cross-cutting concerns (auth, logging, error handling, rate limiting)
live in `core/` and `common/`.

### Frontend (Feature-Based)
- `core/` — singleton services, guards, interceptors, auth state (shared once, app-wide)
- `shared/` — reusable dumb components, directives, pipes, UI primitives
- `features/` — one folder per business feature (lazy-loaded standalone routes)
- `layout/` — app shell (sidebar, topbar, theme toggle)

## Modules Roadmap

| Module | Status |
|---|---|
| Auth (JWT + Refresh + RBAC) | ✅ Foundation in this commit |
| Users | ✅ Foundation in this commit |
| Notes | 🔲 Next |
| Tasks | 🔲 Next |
| Calendar | 🔲 Planned |
| Journal | 🔲 Planned |
| Expense Tracker | 🔲 Planned |
| File Manager | 🔲 Planned |
| Password Vault | 🔲 Planned |
| Habit Tracker | 🔲 Planned |
| Goal Tracker | 🔲 Planned |
| Focus Timer | 🔲 Planned |
| Bookmarks | 🔲 Planned |
| Team Collaboration | 🔲 Planned |
| Analytics | 🔲 Planned |
| Notifications | 🔲 Planned |
| AI Assistant (Chat, OCR, Rewrite, Summary, etc.) | 🔲 Planned |

Each module, when built, will ship with: folder structure, DB design, API endpoints,
Angular components, UI flow, validation rules, business logic, tests, and deployment notes.

## Security

JWT + Refresh Token rotation, RBAC guards, Helmet, CORS, rate limiting, bcrypt password hashing,
class-validator input validation (XSS/CSRF mitigation), secure file upload (S3 signed URLs).

## License

Proprietary — All rights reserved.
