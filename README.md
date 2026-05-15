# Express API Server

## Overview

I'm working on this project to explore the Node/Express

## Local Development

Install dependencies:

```bash
npm install
```

The local development flow runs only PostgreSQL in Docker. The Express app runs on your machine with nodemon.

Start the dev flow:

```bash
npm run dev
```

This command:

- starts the dev PostgreSQL container named `dev_express_server_db`
- applies checked-in Prisma migrations
- regenerates the Prisma client
- generates the latest Swagger JSON at `docs/swagger.json`
- starts the app with nodemon

If you only want to start the dev database:

```bash
npm run db:up
```

Database will be available on `PORT 5500`.

Apply existing Prisma migrations:

```bash
npm run db:migrate
```

Regenerate the Prisma client manually if needed:

```bash
npm run prisma:generate
```

If you need to create a new migration from schema changes:

```bash
npx prisma migrate dev --name your_migration_name
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

## Production Docker

The production-style Docker flow builds the Express app into a container named `express_server` and runs PostgreSQL in a separate container named `express_server_db`.

Build and start the full stack:

```bash
docker compose -f docker-compose.prod.yml up --build
```

The app container startup command:

- applies checked-in Prisma migrations
- regenerates the Prisma client
- generates the latest Swagger JSON
- starts the Node app

Stop the production stack:

```bash
docker compose -f docker-compose.prod.yml down
```

## API Docs

Swagger UI is available after the server starts:

```text
/swagger
```

The raw OpenAPI JSON is available at:

```text
/swagger.json
```

Generate the latest OpenAPI JSON file:

```bash
npm run swagger:generate
```

This writes `docs/swagger.json`. The `npm run dev` command also regenerates this file before starting the server.

## Notes

`npm run dev` starts the dev DB container, applies checked-in migrations, regenerates the Prisma client, generates Swagger docs, and starts the server with nodemon.

`npm start` applies checked-in migrations, regenerates the Prisma client, generates Swagger docs, and starts the server.

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
