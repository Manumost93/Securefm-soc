import { Router } from 'express';
import { getLogs, getSecurityStats } from '../controllers/logs.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('admin', 'technician'));

router.get('/stats', getSecurityStats);
router.get('/', getLogs);

export default router;
