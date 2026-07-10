import { Response, NextFunction } from 'express';
import { prisma } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export const startLiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title } = req.body;

    if (!title?.trim()) {
      return next(new BadRequestError('Tiêu đề buổi phát trực tiếp là bắt buộc'));
    }

    const session = await prisma.liveSession.create({
      data: {
        hostId: userId,
        title: title.trim(),
        status: 'LIVE',
      },
      include: {
        host: { include: { profile: true } },
      },
    });

    res.status(201).json({ status: 'success', data: session });
  } catch (error) {
    next(error);
  }
};

export const endLiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const session = await prisma.liveSession.findUnique({ where: { id } });
    if (!session) return next(new NotFoundError('Buổi phát trực tiếp không tồn tại'));
    if (session.hostId !== userId) return next(new ForbiddenError('Chỉ chủ phòng mới có thể kết thúc'));

    const updated = await prisma.liveSession.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
};

export const getActiveLiveSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await prisma.liveSession.findMany({
      where: { status: 'LIVE' },
      include: {
        host: { include: { profile: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.status(200).json({ status: 'success', data: sessions });
  } catch (error) {
    next(error);
  }
};

export const getLiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        host: { include: { profile: true } },
      },
    });

    if (!session) return next(new NotFoundError('Buổi phát trực tiếp không tồn tại'));

    res.status(200).json({ status: 'success', data: session });
  } catch (error) {
    next(error);
  }
};
