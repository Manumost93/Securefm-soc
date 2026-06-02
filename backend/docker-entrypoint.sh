#!/bin/sh
set -e

echo "[SecureFM SOC] Aplicando migraciones de base de datos..."
node_modules/.bin/prisma migrate deploy

echo "[SecureFM SOC] Iniciando servidor..."
exec node dist/server.js
