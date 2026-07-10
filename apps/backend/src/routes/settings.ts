import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { getSettings, updateSettings } from '../controllers/settings';

const router = Router();
router.use(protect);
router.get('/', getSettings);
router.put('/', updateSettings);
export default router;
