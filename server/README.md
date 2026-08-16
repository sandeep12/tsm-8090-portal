# TSM Portal — API Server (persistence)

Implements **WO-1**: MongoDB models and repositories for `User` and `Task`.

## Layout

```
src/
  config/env.ts           # env-driven configuration (MONGODB_URI, …)
  db/connection.ts        # mongoose connect / disconnect
  models/                 # User & Task schemas + indexes
  repositories/           # UserRepository & TaskRepository
```

## Setup

```bash
cp .env.example .env
# set MONGODB_URI (needed for a live server; smoke test uses an in-memory mongod)
npm install
npm run typecheck
npm run smoke:wo1
```

`npm run smoke:wo1` spins up MongoDB via `mongodb-memory-server` and exercises User/Task repositories (unique email, inactive assignee rejection, filters, counts, delete).

## Domain

| Model | Collection | Notes |
|-------|------------|--------|
| User  | `users`    | unique email index; roles `Administrator` \| `User` |
| Task  | `tasks`    | assignee must be an **active** user (enforced in `TaskRepository`) |

Repositories are the only persistence surface for later controllers (WO-2+). HTTP, auth, and frontend are intentionally out of scope here.
