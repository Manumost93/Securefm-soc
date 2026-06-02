import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  login
);

router.get('/me', authenticate, me);

export default router;
