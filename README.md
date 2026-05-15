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

- pushes Prisma schema changes to the local database
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

Push the current Prisma schema directly in development:

```bash
npm run db:push
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

`npm run dev` pushes the current Prisma schema with `prisma db push`, regenerates the Prisma client, and starts the server.

`npm start` applies checked-in migrations and regenerates the Prisma client before starting.

The app expects a `.env` file with:

```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5500/express_api_db"
LOG_LEVEL=debug
LOG_DIR=logs
LOG_TO_FILE=true
LOG_COLORS=true
ACCESS_TOKEN_EXPIRATION="1h"
REFRESH_TOKEN_EXPIRATION="7d"
JWT_SECRET="replace-with-a-secure-secret"
```

Logging notes:

- `LOG_LEVEL` can be `debug`, `info`, `warn`, or `error`.
- `LOG_TO_FILE=false` disables writing to `logs/app.log` and `logs/error.log`.
- `LOG_COLORS=false` disables colored terminal logs. `LOG_COLORS=true` forces colors.
- `NO_COLOR=1` also disables colors.

## Formatting

Format the project with:

```bash
npm run format
```

Check formatting without changing files:

```bash
npm run format:check
```
