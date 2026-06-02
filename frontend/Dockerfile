# ============================================================
# SecureFM SOC — Frontend Dockerfile (multi-stage)
# ============================================================

# Stage 1: Build — compila la app React con Vite
FROM node:26-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL de la API: en Docker, Nginx proxea /api al backend internamente
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================
# Stage 2: Serve — Nginx sirve los estáticos y proxea la API
# ============================================================
FROM nginx:1.25-alpine AS runner

# Config de Nginx (SPA routing + proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
