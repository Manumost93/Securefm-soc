import { Router } from 'express';
import { body } from 'express-validator';
import { auditUrl } from '../controllers/audit.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('url')
      .notEmpty()
      .withMessage('URL requerida')
      .isLength({ max: 2048 })
      .withMessage('URL demasiado larga'),
  ],
  auditUrl
);

export default router;
