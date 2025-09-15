# syntax=docker/dockerfile:1
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:18-alpine AS runner
WORKDIR /app

RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories && \
    apk add --no-cache doppler

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

COPY --from=build /app/src/swagger /app/dist/swagger
COPY package*.json ./

ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

# Doppler n'est utilisé qu'au démarrage (runtime), pas pendant le build
CMD ["doppler", "run", "--", "node", "dist/server.js"]
