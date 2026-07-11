import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { handleUpload } from '../middlewares/upload';
import {
  createStory,
  getFeedStories,
  viewStory,
  getStoryViews,
  deleteStory,
} from '../controllers/story';

const router = Router();

router.use(protect);

router.post('/', handleUpload('media'), createStory);
router.get('/feed', getFeedStories);
router.post('/view/:id', viewStory);
router.get('/views/:id', getStoryViews);
router.delete('/:id', deleteStory);

export default router;
