import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  deleteMessage,
  addGroupMembers,
  removeGroupMember,
  markMessagesRead,
} from '../controllers/message';

const router = Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);

router.get('/:conversationId/messages', getMessages);
router.put('/:conversationId/read', markMessagesRead);
router.post('/:conversationId/messages', upload.single('media'), sendMessage);
router.delete('/messages/:id', deleteMessage);

router.post('/:conversationId/members', addGroupMembers);
router.delete('/:conversationId/members/:targetUserId', removeGroupMember);

export default router;
