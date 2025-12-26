# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder-base
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

# 1. Frontend builder pour la production
FROM builder-base AS builder-prod
ARG ENVIRONMENT=production

RUN npm install -g @angular/cli
RUN npm run lint
RUN ng build --configuration=$ENVIRONMENT

# 2. Frontend container pour la production (statique)
FROM caddy:2.8.4-alpine AS angular-prod
EXPOSE 80
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder-prod /app/dist/angular /app/browser

# 2.1 Frontend container pour le développement
FROM node:22-alpine AS angular-dev
WORKDIR /app
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
