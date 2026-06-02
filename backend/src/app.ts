import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import ticketRoutes from './routes/tickets.routes';
import userRoutes from './routes/users.routes';
import logRoutes from './routes/logs.routes';
import auditRoutes from './routes/audit.routes';
import profileRoutes from './routes/profile.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message: { message: 'Demasiadas peticiones. Inténtalo más tarde.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados intentos de login. Espera 15 minutos.' },
});

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Límite de auditorías alcanzado. Inténtalo en 15 minutos.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/audit', auditLimiter, auditRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
