import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  startLiveSession,
  endLiveSession,
  getActiveLiveSessions,
  getLiveSession,
} from '../controllers/live';

const router = Router();

router.use(protect);

router.get('/', getActiveLiveSessions);
router.get('/:id', getLiveSession);
router.post('/', startLiveSession);
router.put('/:id/end', endLiveSession);

export default router;
