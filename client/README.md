# TSM Portal — Client App

Implements **WO-3** (SPA shell) and **WO-5** (sign-in flow).

## Setup

```bash
npm install
npm run typecheck
npm run smoke:wo3
npm run dev
```

Optional `.env`:

```bash
VITE_API_BASE_URL=   # empty uses Vite proxy to http://127.0.0.1:3000
```

Run the API (`server/`) alongside the client for a full sign-in.

## Auth flow (WO-5)

- `/sign-in` — email + obscured password, client empty-field checks, in-progress lock
- Success stores `SessionToken` via `AuthContext` and routes to the dashboard
- `401` from `ApiClient` clears the session; `RouteGuard` returns to sign-in
- Sign out clears local session and best-effort notifies `/api/auth/sign-out`
