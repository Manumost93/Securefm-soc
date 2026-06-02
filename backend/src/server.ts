import dotenv from 'dotenv';
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET no está definido en las variables de entorno. El servidor no puede arrancar de forma segura.');
  process.exit(1);
}

import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n[SecureFM SOC] Backend arrancado en http://localhost:${PORT}`);
  console.log(`[SecureFM SOC] Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SecureFM SOC] Health check: http://localhost:${PORT}/api/health\n`);
});
