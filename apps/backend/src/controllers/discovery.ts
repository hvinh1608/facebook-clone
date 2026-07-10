import { Response, NextFunction } from 'express';
import { prisma, ReportTargetType } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { postInclude } from './post';

// Pages
export const getPages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pages = await prisma.page.findMany({
      include: { owner: { include: { profile: true } }, _count: { select: { followers: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json({ status: 'success', data: pages });
  } catch (error) {
    next(error);
  }
};

export const createPage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, category } = req.body;
    if (!name?.trim()) return next(new BadRequestError('Tên trang là bắt buộc'));
    const page = await prisma.page.create({
      data: { name: name.trim(), description, category, ownerId: req.user!.id },
    });
    res.status(201).json({ status: 'success', data: page });
  } catch (error) {
    next(error);
  }
};

// Events
export const getEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      include: { creator: { include: { profile: true } }, _count: { select: { attendees: true } } },
      orderBy: { startAt: 'asc' },
      take: 50,
    });
    res.status(200).json({ status: 'success', data: events });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, location, startAt, endAt } = req.body;
    if (!title?.trim() || !startAt) return next(new BadRequestError('Tiêu đề và thời gian bắt đầu là bắt buộc'));
    const event = await prisma.event.create({
      data: { title: title.trim(), description, location, startAt: new Date(startAt), endAt: endAt ? new Date(endAt) : null, creatorId: req.user!.id },
    });
    res.status(201).json({ status: 'success', data: event });
  } catch (error) {
    next(error);
  }
};

export const joinEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const attendee = await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId: id, userId: req.user!.id } },
      create: { eventId: id, userId: req.user!.id, status: 'GOING' },
      update: { status: 'GOING' },
    });
    res.status(200).json({ status: 'success', data: attendee });
  } catch (error) {
    next(error);
  }
};

// Memories
export const getMemories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const memories = await prisma.memory.findMany({
      where: { userId: req.user!.id },
      orderBy: { memoryDate: 'desc' },
    });
    res.status(200).json({ status: 'success', data: memories });
  } catch (error) {
    next(error);
  }
};

export const createMemory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, memoryDate, imageUrl } = req.body;
    if (!title?.trim()) return next(new BadRequestError('Tiêu đề là bắt buộc'));
    const memory = await prisma.memory.create({
      data: { userId: req.user!.id, title: title.trim(), content, memoryDate: memoryDate ? new Date(memoryDate) : new Date(), imageUrl },
    });
    res.status(201).json({ status: 'success', data: memory });
  } catch (error) {
    next(error);
  }
};

// Marketplace
export const getMarketplaceListings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      include: { seller: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json({ status: 'success', data: listings });
  } catch (error) {
    next(error);
  }
};

export const createMarketplaceListing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, price, location, imageUrl } = req.body;
    if (!title?.trim() || price === undefined) return next(new BadRequestError('Tiêu đề và giá là bắt buộc'));
    const listing = await prisma.marketplaceListing.create({
      data: { sellerId: req.user!.id, title: title.trim(), description, price: parseFloat(price), location, imageUrl },
    });
    res.status(201).json({ status: 'success', data: listing });
  } catch (error) {
    next(error);
  }
};

// Story highlights
export const getStoryHighlights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId || req.user!.id;
    const highlights = await prisma.storyHighlight.findMany({
      where: { userId },
      include: { stories: true },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ status: 'success', data: highlights });
  } catch (error) {
    next(error);
  }
};

export const createStoryHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, storyIds } = req.body;
    if (!title?.trim()) return next(new BadRequestError('Tên highlight là bắt buộc'));
    const highlight = await prisma.storyHighlight.create({
      data: { userId: req.user!.id, title: title.trim() },
    });
    if (Array.isArray(storyIds) && storyIds.length > 0) {
      await prisma.story.updateMany({
        where: { id: { in: storyIds }, userId: req.user!.id },
        data: { highlightId: highlight.id },
      });
    }
    res.status(201).json({ status: 'success', data: highlight });
  } catch (error) {
    next(error);
  }
};

export const getPageById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const page = await prisma.page.findUnique({
      where: { id },
      include: { owner: { include: { profile: true } }, _count: { select: { followers: true } } },
    });
    if (!page) return next(new NotFoundError('Page not found'));

    const isFollowing = await prisma.pageFollow.findUnique({
      where: { pageId_userId: { pageId: id, userId: req.user!.id } },
    });

    res.status(200).json({
      status: 'success',
      data: { ...page, isFollowing: !!isFollowing },
    });
  } catch (error) {
    next(error);
  }
};

export const followPage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) return next(new NotFoundError('Page not found'));

    await prisma.pageFollow.upsert({
      where: { pageId_userId: { pageId: id, userId: req.user!.id } },
      create: { pageId: id, userId: req.user!.id },
      update: {},
    });

    res.status(200).json({ status: 'success', message: 'Page followed' });
  } catch (error) {
    next(error);
  }
};

export const unfollowPage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.pageFollow.delete({
      where: { pageId_userId: { pageId: id, userId: req.user!.id } },
    });
    res.status(200).json({ status: 'success', message: 'Page unfollowed' });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: { creator: { include: { profile: true } }, _count: { select: { attendees: true } } },
    });
    if (!event) return next(new NotFoundError('Event not found'));

    const attendance = await prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: req.user!.id } },
    });

    res.status(200).json({
      status: 'success',
      data: { ...event, myStatus: attendance?.status ?? null },
    });
  } catch (error) {
    next(error);
  }
};

export const leaveEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.eventAttendee.delete({
      where: { eventId_userId: { eventId: id, userId: req.user!.id } },
    });
    res.status(200).json({ status: 'success', message: 'Left event' });
  } catch (error) {
    next(error);
  }
};

export const getMarketplaceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { seller: { include: { profile: true } } },
    });
    if (!listing) return next(new NotFoundError('Listing not found'));
    res.status(200).json({ status: 'success', data: listing });
  } catch (error) {
    next(error);
  }
};

export const getOnThisDayMemories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    const currentYear = now.getFullYear();

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        groupId: null,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        createdAt: { lt: new Date(currentYear, month, day + 1) },
      },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
    });

    const memories = posts.filter((p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() === month && d.getDate() === day && d.getFullYear() < currentYear;
    });

    res.status(200).json({ status: 'success', data: memories });
  } catch (error) {
    next(error);
  }
};

export const reportUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return next(new BadRequestError('Reason is required'));

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return next(new NotFoundError('User not found'));

    await prisma.report.create({
      data: {
        reporterId,
        targetType: ReportTargetType.USER,
        targetId: id,
        reason,
      },
    });

    res.status(200).json({ status: 'success', message: 'User reported successfully' });
  } catch (error) {
    next(error);
  }
};

export const reportComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user!.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return next(new BadRequestError('Reason is required'));

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return next(new NotFoundError('Comment not found'));

    await prisma.report.create({
      data: {
        reporterId,
        targetType: ReportTargetType.COMMENT,
        targetId: id,
        reason,
      },
    });

    res.status(200).json({ status: 'success', message: 'Comment reported successfully' });
  } catch (error) {
    next(error);
  }
};
