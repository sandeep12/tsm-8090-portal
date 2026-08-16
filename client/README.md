# TSM Portal — Client App

Implements **WO-3**: React SPA shell with `ApiClient`, `AuthContext`, `RouteGuard`, and `AsyncStateView`.

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

## Layout

```
src/
  api/           # ApiClient + token storage
  auth/          # AuthContext / useAuth
  components/    # RouteGuard, AsyncStateView, AppLayout
  pages/         # placeholders until feature WOs
  types/         # ErrorResponse, UserDto
```

## Behaviour

- Unauthenticated users are redirected to `/sign-in` (screen itself is WO-5).
- `/users` requires Administrator role (client-side only).
- `ApiClient` attaches `Authorization: Bearer …`, parses `ErrorResponse`, and signs out on `401`.
