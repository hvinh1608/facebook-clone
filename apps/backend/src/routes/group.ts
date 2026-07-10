import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  createGroup,
  getGroupDetails,
  updateGroup,
  updateGroupImages,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  getPendingMembers,
  approveMember,
  declineMember,
  removeMember,
  updateMemberRole,
  getGroupPosts,
  getJoinedGroups,
  getExploreGroups,
  searchGroups,
} from '../controllers/group';

const router = Router();

router.use(protect);

router.post('/', createGroup);
router.get('/joined', getJoinedGroups);
router.get('/explore', getExploreGroups);
router.get('/search', searchGroups);

router.get('/:id', getGroupDetails);
router.put('/:id', updateGroup);
router.put('/:id/images', upload.single('image'), updateGroupImages);

router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);

router.get('/:id/members', getGroupMembers);
router.get('/:id/pending', getPendingMembers);
router.post('/:id/approve/:targetUserId', approveMember);
router.delete('/:id/decline/:targetUserId', declineMember);
router.delete('/:id/remove/:targetUserId', removeMember);
router.put('/:id/members/:targetUserId/role', updateMemberRole);

router.get('/:id/posts', getGroupPosts);

export default router;
