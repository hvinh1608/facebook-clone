import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { upload } from '../middlewares/upload';
import { createPostSchema, createCommentSchema } from '../utils/validators';
import {
  createPost,
  getFeedPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  savePost,
  unsavePost,
  getSavedPosts,
  reportPost,
  reactPost,
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  reactComment,
  getWatchPosts,
  sharePost,
  searchPosts,
  votePoll,
  getScheduledPosts,
} from '../controllers/post';

const router = Router();

router.use(protect); // Require auth for post interaction

// Post Core
router.post('/', upload.array('media', 10), validate(createPostSchema), createPost);
router.get('/feed', getFeedPosts);
router.get('/watch', getWatchPosts);
router.get('/search', searchPosts);
router.get('/scheduled', getScheduledPosts);
router.get('/user/:userId', getUserPosts);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

// Save Post
router.get('/saved', getSavedPosts);
router.post('/save/:id', savePost);
router.delete('/unsave/:id', unsavePost);

router.get('/:id', getPostById);

// Report Post
router.post('/report/:id', reportPost);

// React Post
router.post('/:id/react', reactPost);
router.post('/:id/vote', votePoll);
router.post('/:id/share', sharePost);

// Comments
router.post('/:postId/comments', validate(createCommentSchema), createComment);
router.get('/:postId/comments', getPostComments);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);
router.post('/comments/:id/react', reactComment);

export default router;
