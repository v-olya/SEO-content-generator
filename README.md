# How-to

Single-repo setup with an Angular frontend and a NestJS backend.

## Prerequisites

- Node.js 20+
- npm

## Frontend (Angular)

**Location:** root folder

### Development server

```bash
ng serve
```

Open `http://localhost:4200/`. The dev server uses the proxy from `proxy.conf.json` so `/api` calls are forwarded to `http://localhost:3000`.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Backend (NestJS)

**Location:** `backend/`

### Development server

```bash
cd backend
npm run start:dev
```

The API runs on `http://localhost:3000`.

### Build

```bash
cd backend
npm run build
```

### Production start

```bash
cd backend
npm start
```

### Environment variables

- `CORS_ORIGIN` (optional): comma-separated list of allowed origins. Defaults to `http://localhost:4200`.

## Useful links

- Angular CLI: https://angular.dev/tools/cli
- NestJS: https://docs.nestjs.com/
