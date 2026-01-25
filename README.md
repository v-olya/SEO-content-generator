# Article generator

Small monorepo app that creates well-structured content from a general search query.

- Frontend: Angular 20 SPA that talks to the backend via a local proxy.
- Backend: NestJS handles processing and content generation.

## What this project does

- Collects search suggestions and related queries for a seed phrase.
- Clusters and groups key phrases into topic groups.
- Generates a structured SEO article from a chosen query/cluster.
- Produces an accompanying image and Rich Results markup as schema.org microdata (the agent enforces microdata and validates it using the `validate_microdata` tool via Rich Results Web Testing Tool).

## Quick start

Prerequisites: Node.js 20+ and npm.

- Install dependencies (root and backend):

```bash
npm install
cd backend && npm install
```

- Run frontend dev server (root):

```bash
ng serve
```

- Run backend dev server:

```bash
cd backend
npm run start:dev
```

The frontend dev server uses `proxy.conf.json` so `/api` requests are forwarded to the backend (default: http://localhost:3000).

## Tech stack

- **Languages:** TypeScript
- **Frontend:** Angular
- **Backend:** NestJS (Node.js)
- **Package manager:** npm
- **LLM models (backend):** gpt-4o-mini, gpt-4o (OpenAI)

## Useful locations

- Frontend entry: [src/main.ts](src/main.ts)
- Backend entry: [backend/src/main.ts](backend/src/main.ts)
- Example controller: [backend/src/article/image.controller.ts](backend/src/article/image.controller.ts)

## Environment

- `OPENAI_API_KEY`: required for LLM-based clustering and article generation.
- `CORS_ORIGIN` (optional): comma-separated list of allowed origins for CORS. Defaults to `http://localhost:4200`.
