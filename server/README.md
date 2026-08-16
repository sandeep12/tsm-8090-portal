# TSM Portal — API Server

Implements **WO-1** (persistence) and **WO-2** (Express scaffold + validation/errors).

## Layout

```
src/
  config/env.ts              # MONGODB_URI, PORT, JWT_*
  db/connection.ts           # mongoose connect / disconnect
  models/                    # User & Task schemas
  repositories/              # UserRepository & TaskRepository
  app.ts / server.ts         # Express bootstrap + listen
  middleware/                # validateRequest, errorHandler
  errors/                    # HTTP AppError hierarchy
  validation/                # UserInput / TaskInput Zod schemas
  routes/                    # /api shell (health + resource placeholders)
```

## Setup

```bash
cp .env.example .env
# set MONGODB_URI and JWT_SECRET
npm install
npm run typecheck
npm run smoke:wo1
npm run smoke:wo2
npm run dev                  # requires .env + reachable MongoDB
```

## HTTP contract (WO-2)

- `GET /api/health` → `{ status: "ok" }`
- Unknown routes → `404` `ErrorResponse`
- Invalid bodies (via `validateRequest`) → `400` with every field error
- `DuplicateEmailError` → `409`
- Error bodies never include stack traces

Feature controllers (auth/tasks/users/dashboard) arrive in later work orders.
