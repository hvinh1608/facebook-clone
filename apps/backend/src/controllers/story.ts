import { Response, NextFunction } from 'express';
import { prisma, MediaType } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { uploadMediaFile } from '../utils/cloudinary';

export const createStory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return next(new BadRequestError('Please upload an image or video file for your story'));
    }

    const type = req.file.mimetype.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE;
    const mediaUrl = await uploadMediaFile(req.file, 'facebook/stories');
    const { caption } = req.body;
    let stickerData = null;
    if (req.body.stickerData) {
      try {
        stickerData = typeof req.body.stickerData === 'string'
          ? JSON.parse(req.body.stickerData)
          : req.body.stickerData;
      } catch {
        stickerData = null;
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const story = await prisma.story.create({
      data: {
        userId,
        mediaUrl,
        mediaType: type,
        expiresAt,
        caption: caption?.trim() || null,
        stickerData,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    res.status(201).json({
      status: 'success',
      data: story,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedStories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;

    // Get friend list
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }] },
    });
    const friendIds = friendships.map((f) => f.user1Id === currentUserId ? f.user2Id : f.user1Id);

    // Block list
    const blockedList = await prisma.block.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
    });
    const blockedUserIds = blockedList.map((b) => b.blockerId === currentUserId ? b.blockedId : b.blockerId);

    const activeUserIds = [currentUserId, ...friendIds].filter((id) => !blockedUserIds.includes(id));

    // Get stories not expired yet
    const stories = await prisma.story.findMany({
      where: {
        userId: { in: activeUserIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { include: { profile: true } },
        views: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group stories by User
    const groupedStoriesMap = new Map<string, any>();

    stories.forEach((story) => {
      const u = story.user;
      if (!groupedStoriesMap.has(u.id)) {
        groupedStoriesMap.set(u.id, {
          userId: u.id,
          displayName: u.profile?.displayName,
          avatarUrl: u.profile?.avatarUrl,
          stories: [],
        });
      }

      // Check if current user viewed this story
      const hasViewed = story.views.some((v) => v.userId === currentUserId);

      groupedStoriesMap.get(u.id).stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        stickerData: story.stickerData,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        hasViewed,
      });
    });

    const groupedStories = Array.from(groupedStoriesMap.values());

    res.status(200).json({
      status: 'success',
      data: groupedStories,
    });
  } catch (error) {
    next(error);
  }
};

export const viewStory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const storyId = req.params.id;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story || story.expiresAt < new Date()) {
      return next(new NotFoundError('Story not found or expired'));
    }

    // Do not record view if it is own story
    if (story.userId !== userId) {
      await prisma.storyView.upsert({
        where: { storyId_userId: { storyId, userId } },
        create: { storyId, userId },
        update: {},
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Story view recorded',
    });
  } catch (error) {
    next(error);
  }
};

export const getStoryViews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const storyId = req.params.id;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) return next(new NotFoundError('Story not found'));

    if (story.userId !== userId) {
      return next(new ForbiddenError('Only the story creator can view the viewer list'));
    }

    const views = await prisma.storyView.findMany({
      where: { storyId },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { viewedAt: 'desc' },
    });

    const viewers = views.map((v) => ({
      userId: v.user.id,
      displayName: v.user.profile?.displayName,
      avatarUrl: v.user.profile?.avatarUrl,
      viewedAt: v.viewedAt,
    }));

    res.status(200).json({
      status: 'success',
      data: viewers,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return next(new NotFoundError('Story not found'));

    if (story.userId !== userId) {
      return next(new ForbiddenError('You can only delete your own stories'));
    }

    await prisma.story.delete({ where: { id } });

    res.status(200).json({
      status: 'success',
      message: 'Story deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
