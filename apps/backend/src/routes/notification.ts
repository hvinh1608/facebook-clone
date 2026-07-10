import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getNotifications,
  markAsRead,
  deleteNotification,
} from '../controllers/notification';

const router = Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
