# syntax=docker/dockerfile:1.6
#
# Finance Portal Frontend — Multi-stage Node 20 build → Nginx static serve.
#
# Build:   docker build -t finance-portal-frontend ./finance-frontend
# Run:     docker run --rm -p 5173:80 finance-portal-frontend
#
# docker-compose.yml içindeki `app-frontend` servisi tarafından kullanılır.

# -----------------------------------------------------------------------------
# Stage 1 — build (Vite + React 19 derleme)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# package*.json önce — bağımlılıklar cache'lensin
COPY package.json package-lock.json* ./
# react-simple-maps peer dep'i react 18'i max kabul ediyor; biz react 19'dayız → --legacy-peer-deps
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Kaynak kod
COPY . .

# Build-time env: API URL container'lar arası için runtime'da nginx tarafından proxy edilir.
# Dolayısıyla VITE_API_BASE_URL build aşamasında relative bir path olabilir.
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_KEYCLOAK_URL=http://localhost:8080
ARG VITE_KEYCLOAK_REALM=finance-realm
ARG VITE_KEYCLOAK_CLIENT_ID=finance-client
ARG VITE_APP_URL=http://localhost:5173

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL} \
    VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM} \
    VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID} \
    VITE_APP_URL=${VITE_APP_URL}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2 — runtime (Nginx, static dist/)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# SPA için custom nginx config — try_files ile React Router fallback + /api proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısı
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck — root sayfası dönüyor mu
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80
