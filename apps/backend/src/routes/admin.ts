import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth';
import {
  getDashboardStats,
  getUsersList,
  blockUserAccount,
  unblockUserAccount,
  getReports,
  resolveReport,
  deleteViolationPost,
} from '../controllers/admin';

const router = Router();

// Secure all admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/users', getUsersList);
router.put('/users/:userId/block', blockUserAccount);
router.put('/users/:userId/unblock', unblockUserAccount);

router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);
router.delete('/posts/:postId', deleteViolationPost);

export default router;
