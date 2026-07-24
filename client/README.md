# AMS Client (Next.js)

## Setup

1. Copy env and point at your API:

   ```bash
   cp .env.local.example .env.local
   ```

2. On the **server**, set `CLIENT_URL` to this app (default Next port):

   ```
   CLIENT_URL=http://localhost:3000
   ```

3. Run API (`project-3-ams/server`) and client:

   ```bash
   npm run dev          # client → http://localhost:3000
   ```

## Features

- Cookie-based auth (`/api/v1/auth/login`, `me`, `logout`) with `credentials: "include"`
- Project list and per-project resource browser (folders, upload, delete)
- Lists folder contents via `GET /api/v1/projects/:id/resources?resourceId=<folderId>`

## API module

See `src/lib/api.ts` for typed helpers (`authApi`, `projectsApi`, `resourcesApi`).
