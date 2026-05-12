# Express API Server

## Overview

I'm working on this project to explore the Node/Express

## Setup 

1. Spin up the PostgreSQL container:

```bash
 docker compose up -d
```

Database will be available on `PORT 5500`

2. Set up:

```bash
 npx prisma migrate dev --name init
 npx prisma generate
```

3. Run server:
```bash
 npm run dev
```
Server will run on `PORT 5000`