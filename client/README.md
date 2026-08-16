# TSM Portal — Client App

Implements **WO-3** (SPA shell), **WO-5** (sign-in), **WO-7** (task screens), and **WO-9** (dashboard).

## Setup

```bash
npm install
npm run typecheck
npm run smoke:wo3
npm run dev
```

Run the API (`server/`) alongside the client. After sign-in, users land on `/` (dashboard).

## Screens

| Route | Screen |
|-------|--------|
| `/` | Dashboard — counts + recent activity |
| `/tasks` | Task list |
| `/tasks/new` | Create task |
| `/tasks/:id` | Task detail |
| `/tasks/:id/edit` | Edit task |
| `/sign-in` | Sign in |
