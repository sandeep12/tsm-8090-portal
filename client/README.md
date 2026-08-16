# TSM Portal — Client App

Implements **WO-3** (SPA shell), **WO-5** (sign-in), **WO-7** (tasks), **WO-9** (dashboard), and **WO-11** (users).

## Setup

```bash
npm install
npm run typecheck
npm run smoke:wo3
npm run dev
```

Run the API (`server/`) alongside the client.

## Screens

| Route | Screen |
|-------|--------|
| `/` | Dashboard |
| `/tasks` | Task list |
| `/tasks/new` · `/tasks/:id` · `/tasks/:id/edit` | Task create / detail / edit |
| `/users` | User directory (admin) |
| `/users/new` · `/users/:id/edit` | User create / edit (admin) |
| `/sign-in` | Sign in |
