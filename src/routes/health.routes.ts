import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/', healthController.getHealth);
router.get('/stats', healthController.getStats);

export default router;