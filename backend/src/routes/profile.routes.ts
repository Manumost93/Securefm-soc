import { Router } from 'express';
import { body } from 'express-validator';
import { changePassword, updateProfile } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.put('/name', updateProfile);
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña mínimo 6 caracteres'),
], changePassword);

export default router;
