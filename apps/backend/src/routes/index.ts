import { Router, Request, Response } from 'express';
import { getCloudinaryStatus, verifyCloudinaryCredentials } from '../utils/cloudinary';
import authRouter from './auth';
import userRouter from './user';
import postRouter from './post';
import friendRouter from './friend';
import storyRouter from './story';
import groupRouter from './group';
import messageRouter from './message';
import notificationRouter from './notification';
import adminRouter from './admin';
import settingsRouter from './settings';
import discoveryRouter from './discovery';
import liveRouter from './live';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  await verifyCloudinaryCredentials();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cloudinary: getCloudinaryStatus(),
  });
});

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/friends', friendRouter);
router.use('/stories', storyRouter);
router.use('/groups', groupRouter);
router.use('/messages', messageRouter);
router.use('/notifications', notificationRouter);
router.use('/admin', adminRouter);
router.use('/settings', settingsRouter);
router.use('/discovery', discoveryRouter);
router.use('/live', liveRouter);

export default router;
