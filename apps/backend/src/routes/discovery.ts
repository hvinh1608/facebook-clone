import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getPages,
  createPage,
  getPageById,
  followPage,
  unfollowPage,
  getEvents,
  createEvent,
  getEventById,
  joinEvent,
  leaveEvent,
  getMemories,
  createMemory,
  getOnThisDayMemories,
  getMarketplaceListings,
  createMarketplaceListing,
  getMarketplaceById,
  getStoryHighlights,
  createStoryHighlight,
  reportUser,
  reportComment,
} from '../controllers/discovery';

const router = Router();
router.use(protect);

router.get('/pages', getPages);
router.post('/pages', createPage);
router.get('/pages/:id', getPageById);
router.post('/pages/:id/follow', followPage);
router.delete('/pages/:id/follow', unfollowPage);

router.get('/events', getEvents);
router.post('/events', createEvent);
router.get('/events/:id', getEventById);
router.post('/events/:id/join', joinEvent);
router.delete('/events/:id/join', leaveEvent);

router.get('/memories', getMemories);
router.post('/memories', createMemory);
router.get('/memories/on-this-day', getOnThisDayMemories);

router.get('/marketplace', getMarketplaceListings);
router.post('/marketplace', createMarketplaceListing);
router.get('/marketplace/:id', getMarketplaceById);

router.get('/highlights', getStoryHighlights);
router.get('/highlights/:userId', getStoryHighlights);
router.post('/highlights', createStoryHighlight);

router.post('/users/:id/report', reportUser);
router.post('/comments/:id/report', reportComment);

export default router;
