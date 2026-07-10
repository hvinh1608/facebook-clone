import { Response, NextFunction } from 'express';
import { prisma, Privacy } from 'database';
import { AuthRequest } from '../middlewares/auth';

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId } });
    }
    res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      profileVisibility,
      whoCanFriendRequest,
      whoCanMessage,
      notifyLike,
      notifyComment,
      notifyShare,
      notifyFriendRequest,
      notifyMessage,
      theme,
    } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        ...(profileVisibility !== undefined && { profileVisibility }),
        ...(whoCanFriendRequest !== undefined && { whoCanFriendRequest }),
        ...(whoCanMessage !== undefined && { whoCanMessage }),
        ...(notifyLike !== undefined && { notifyLike }),
        ...(notifyComment !== undefined && { notifyComment }),
        ...(notifyShare !== undefined && { notifyShare }),
        ...(notifyFriendRequest !== undefined && { notifyFriendRequest }),
        ...(notifyMessage !== undefined && { notifyMessage }),
        ...(theme !== undefined && { theme }),
      },
      update: {
        ...(profileVisibility !== undefined && { profileVisibility }),
        ...(whoCanFriendRequest !== undefined && { whoCanFriendRequest }),
        ...(whoCanMessage !== undefined && { whoCanMessage }),
        ...(notifyLike !== undefined && { notifyLike }),
        ...(notifyComment !== undefined && { notifyComment }),
        ...(notifyShare !== undefined && { notifyShare }),
        ...(notifyFriendRequest !== undefined && { notifyFriendRequest }),
        ...(notifyMessage !== undefined && { notifyMessage }),
        ...(theme !== undefined && { theme }),
      },
    });

    res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    next(error);
  }
};
