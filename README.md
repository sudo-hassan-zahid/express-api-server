# Express API Server

## Overview

I'm working on this project to explore the Node/Express

## Setup 

1. Spin up the PostgreSQL container:

```bash
 docker compose up -d
```

2. Run Prisma Migrations:

```bash
 npx prisma migrate dev --name init
```

3. Run server:
```bash
 npm run dev
```