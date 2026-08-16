# TSM Portal — Client App

Implements **WO-3** (SPA shell), **WO-5** (sign-in), and **WO-7** (task screens).

## Setup

```bash
npm install
npm run typecheck
npm run smoke:wo3
npm run dev
```

Run the API (`server/`) alongside the client.

## Task screens (WO-7)

| Route | Screen |
|-------|--------|
| `/tasks` | List with search + status/priority filters |
| `/tasks/new` | Create form (status defaults to To Do) |
| `/tasks/:id` | Detail, status change, delete confirm |
| `/tasks/:id/edit` | Edit form |
