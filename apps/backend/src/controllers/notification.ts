import { Response, NextFunction } from 'express';
import { prisma } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { NotFoundError } from '../utils/errors';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { receiverId },
      include: {
        sender: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to top 50 most recent notifications
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      entityId: n.entityId,
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.sender ? {
        id: n.sender.id,
        displayName: n.sender.profile?.displayName,
        avatarUrl: n.sender.profile?.avatarUrl,
      } : null,
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;
    const { id } = req.params; // If "all", mark all as read

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { receiverId, isRead: false },
        data: { isRead: true },
      });

      return res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, receiverId },
    });

    if (!notification) {
      return next(new NotFoundError('Notification not found'));
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, receiverId },
    });

    if (!notification) {
      return next(new NotFoundError('Notification not found'));
    }

    await prisma.notification.delete({ where: { id } });

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
