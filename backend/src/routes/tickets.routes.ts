import { Router } from 'express';
import { body } from 'express-validator';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addComment,
  getStats,
} from '../controllers/tickets.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getTickets);
router.get('/:id', getTicket);

router.post(
  '/',
  [
    body('title').trim().notEmpty().isLength({ max: 200 }).withMessage('Título requerido (máx 200 chars)'),
    body('description').trim().notEmpty().withMessage('Descripción requerida'),
    body('category').notEmpty().withMessage('Categoría requerida'),
    body('location').trim().notEmpty().withMessage('Ubicación requerida'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  authorize('admin', 'technician'),
  createTicket
);

router.put('/:id', authorize('admin', 'technician'), updateTicket);

router.delete('/:id', authorize('admin'), deleteTicket);

router.post(
  '/:id/comments',
  [body('content').trim().notEmpty().withMessage('Comentario requerido')],
  authorize('admin', 'technician'),
  addComment
);

export default router;
