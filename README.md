# Express API Server

## Overview

I'm working on this project to explore the Node/Express

## Commands

Install dependencies:

```bash
npm install
```

Start the PostgreSQL container:

```bash
docker compose up -d
```

Database will be available on `PORT 5500`.

Create and apply the initial Prisma migration:

```bash
npx prisma migrate dev --name init
```

Regenerate the Prisma client manually if needed:

```bash
npm run prisma:generate
```

Start the app in development mode:

```bash
npm run dev
```

Start the app without nodemon:

```bash
npm start
```

The server runs on `PORT 5000`.

## Notes

`npm run dev` and `npm start` both run Prisma client generation automatically before starting the server.

The app expects a `.env` file with:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5500/express_api_db"
```

## Formatting

Format the project with:

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```
