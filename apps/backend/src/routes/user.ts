import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { upload } from '../middlewares/upload';
import { updateProfileSchema } from '../utils/validators';
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  updateCover,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getFriendsList,
  getBlockedUsers,
  searchUsers,
  getFriendSuggestions,
  getSearchHistory,
  clearSearchHistory,
} from '../controllers/user';

const router = Router();

router.use(protect); // All user routes require authentication

router.put('/profile', validate(updateProfileSchema), updateProfile);
router.get('/profile/:id', getUserProfile);
router.put('/avatar', upload.single('avatar'), updateAvatar);
router.put('/cover', upload.single('cover'), updateCover);

router.post('/follow/:id', followUser);
router.delete('/unfollow/:id', unfollowUser);
router.post('/block/:id', blockUser);
router.delete('/unblock/:id', unblockUser);

router.get('/friends/:id', getFriendsList);
router.get('/blocked', getBlockedUsers);
router.get('/suggestions', getFriendSuggestions);
router.get('/search', searchUsers);
router.get('/search/history', getSearchHistory);
router.delete('/search/history', clearSearchHistory);

export default router;
