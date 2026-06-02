import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getMetrics } from '../controllers/metrics.controller';

const router = Router();

// Solo admin y technician pueden ver métricas del sistema
router.get('/', authenticate, authorize('admin', 'technician'), getMetrics);

export default router;
