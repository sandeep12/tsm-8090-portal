# TSM Portal — API Server

Implements **WO-1** (persistence), **WO-2** (Express scaffold), and **WO-4** (auth).

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
npm run dev
```

## Auth API (WO-4)

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/sign-in` | `{ email, password }` → `AuthResponse` |
| POST | `/api/auth/sign-out` | bearer required; client discards token |
| GET | `/api/auth/me` | current session user |

Bad credentials always return the same message. Inactive accounts are refused at sign-in and on the next authenticated request.
