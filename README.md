# Express API Server

## Overview

I'm working on this project to explore the Node/Express

## Commands

Install dependencies:

```bash
npm install
```

### Option 1

Spin up DB container using:

```bash
docker compose up -d
```

And then use the one-command local development flow:

```bash
npm run dev
```

This command:

- applies checked-in Prisma migrations
- regenerates the Prisma client
- starts the app with nodemon

### OR

Run the setup steps manually:

Start the PostgreSQL container:

```bash
docker compose up -d
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

## API Docs

Swagger UI is available after the server starts:

```text
http://localhost:5000/api-docs
```

The raw OpenAPI JSON is available at:

```text
http://localhost:5000/api-docs.json
```

Generate the latest OpenAPI JSON file:

```bash
npm run swagger:generate
```

This writes `docs/swagger.json`. The `npm run dev` command also regenerates this file before starting the server.

## Notes

`npm run dev` starts Docker, applies checked-in migrations, and regenerates the Prisma client before starting the server.

`npm start` applies checked-in migrations and regenerates the Prisma client before starting.

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
