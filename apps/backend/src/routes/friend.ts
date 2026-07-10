import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  getReceivedRequests,
  getSentRequests,
} from '../controllers/friend';

const router = Router();

router.use(protect);

router.post('/request/:receiverId', sendFriendRequest);
router.delete('/request/cancel/:receiverId', cancelFriendRequest);
router.post('/request/accept/:senderId', acceptFriendRequest);
router.delete('/request/decline/:senderId', declineFriendRequest);
router.delete('/unfriend/:friendId', unfriend);

router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);

export default router;
