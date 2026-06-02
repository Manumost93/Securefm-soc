import { Router } from 'express';
import { body } from 'express-validator';
import { getUsers, getUser, createUser, updateUser, getTechnicians } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/technicians', getTechnicians);
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);

router.post(
  '/',
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
    body('name').trim().notEmpty().withMessage('Nombre requerido'),
    body('role').optional().isIn(['admin', 'technician', 'viewer']),
  ],
  createUser
);

router.put('/:id', authorize('admin'), updateUser);

export default router;
