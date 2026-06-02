# ============================================================
# SecureFM SOC — Backend Dockerfile (multi-stage)
# ============================================================

# Stage 1: Build — instala todas las deps y compila TypeScript
FROM node:18-alpine AS builder

WORKDIR /app

# Copia manifiestos de dependencias primero (aprovecha cache de capas)
COPY package*.json ./

# Instala TODAS las dependencias (incluyendo devDeps para compilar)
RUN npm ci

# Copia schema y genera el cliente Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Copia el resto del código fuente y compila
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ============================================================
# Stage 2: Runtime — imagen mínima de producción
# ============================================================
FROM node:18-alpine AS runner

WORKDIR /app

# Instala solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el cliente Prisma generado desde el builder
# (evita re-generar y tener que incluir el CLI de Prisma en producción)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copia el binario de Prisma CLI para poder ejecutar migraciones al arrancar
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copia el schema (necesario para migrate deploy)
COPY prisma ./prisma

# Copia el código compilado
COPY --from=builder /app/dist ./dist

# Copia el entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
