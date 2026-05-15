#!/bin/sh
set -e

npm run db:migrate
npm run prisma:generate
npm run swagger:generate

exec "$@"
