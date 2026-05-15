FROM node:22-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM dependencies AS build

COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN npm run prisma:generate
RUN npm run swagger:generate

FROM base AS runner

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/docs ./docs
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN chmod +x scripts/docker-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["scripts/docker-entrypoint.sh"]
CMD ["npm", "run", "start:app"]
