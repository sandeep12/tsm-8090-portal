# TSM Portal — API Server

Implements **WO-1** (persistence), **WO-2** (Express scaffold), **WO-4** (auth), **WO-6** (Task API), **WO-8** (Dashboard API), and **WO-10** (User API).

## Layout

```
src/
  config/env.ts              # MONGODB_URI, PORT, JWT_*
  db/connection.ts           # mongoose connect / disconnect
  models/                    # User & Task schemas
  repositories/              # UserRepository & TaskRepository
  app.ts / server.ts         # Express bootstrap + listen
  middleware/                # validate, errorHandler, authenticate, authorize
  auth/                      # AuthController, AuthService, TokenService
  validation/                # UserInput / TaskInput Zod schemas
  routes/                    # /api shell
```

## Setup

```bash
cp .env.example .env
# set MONGODB_URI and JWT_SECRET
npm install
npm run typecheck
npm run smoke:wo1
npm run smoke:wo2
npm run smoke:wo4
npm run smoke:wo6
npm run smoke:wo8
npm run smoke:wo10
npm run dev
```

## Auth API (WO-4)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/sign-in` | `{ email, password }` → `AuthResponse` |
| POST | `/api/auth/sign-out` | bearer required; client discards token |
| GET | `/api/auth/me` | current session user |

Bad credentials always return the same message. Inactive accounts are refused at sign-in and on the next authenticated request.

## Task API (WO-6)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/tasks` | list (`q`, `status`, `priority`); scoped by role |
| POST | `/api/tasks` | create (`TaskInput`) |
| GET | `/api/tasks/:id` | read (owner or admin) |
| PATCH | `/api/tasks/:id` | update |
| PATCH | `/api/tasks/:id/status` | status change |
| DELETE | `/api/tasks/:id` | delete |

## Dashboard API (WO-8)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/dashboard` | scoped counts + recent tasks (`DashboardSummary`) |

## User API (WO-10) — administrator only

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/users` | list |
| POST | `/api/users` | create (defaults role=User, active=true) |
| GET | `/api/users/:id` | read |
| PATCH | `/api/users/:id` | update name/email/password |
| PATCH | `/api/users/:id/active` | `{ active }` |
| PATCH | `/api/users/:id/role` | `{ role }` |
