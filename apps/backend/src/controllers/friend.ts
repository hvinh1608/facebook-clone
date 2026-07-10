import { Response, NextFunction } from 'express';
import { prisma, RequestStatus } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { createAndPushNotification } from '../utils/notifications';
import { canSendFriendRequest } from '../utils/privacy';

export const sendFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const receiverId = req.params.receiverId;

    if (senderId === receiverId) {
      return next(new BadRequestError('You cannot send a friend request to yourself'));
    }

    // Check if target user exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return next(new NotFoundError('User not found'));

    // Check block
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (block) return next(new BadRequestError('Cannot send request. Block relationship exists.'));

    const allowed = await canSendFriendRequest(senderId, receiverId);
    if (!allowed) {
      return next(new ForbiddenError('This user is not accepting friend requests'));
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });
    if (existingFriendship) {
      return next(new BadRequestError('You are already friends with this user'));
    }

    // Check if friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return next(new BadRequestError('A pending friend request already exists between you'));
      }
      // If declined, update status back to pending
      if (existingRequest.senderId === senderId) {
        await prisma.friendRequest.update({
          where: { id: existingRequest.id },
          data: { status: RequestStatus.PENDING },
        });
        await createAndPushNotification({
          receiverId,
          senderId,
          type: 'FRIEND_REQUEST',
          entityId: senderId,
        });
        return res.status(200).json({ status: 'success', message: 'Friend request sent' });
      } else {
        return next(new BadRequestError('The other user has sent you a request. Please accept it instead.'));
      }
    }

    // Create new friend request
    await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: RequestStatus.PENDING,
      },
    });

    await createAndPushNotification({
      receiverId,
      senderId,
      type: 'FRIEND_REQUEST',
      entityId: senderId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Friend request sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const receiverId = req.params.receiverId;

    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (!request || request.status !== 'PENDING') {
      return next(new NotFoundError('Pending friend request not found'));
    }

    await prisma.friendRequest.delete({
      where: { id: request.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Friend request cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;
    const senderId = req.params.senderId;

    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (!request || request.status !== 'PENDING') {
      return next(new NotFoundError('Pending friend request not found'));
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update request status to ACCEPTED
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.ACCEPTED },
      });

      // 2. Create friendship (order ids to ensure user1Id < user2Id for unique constraint consistency)
      const [u1, u2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
      await tx.friendship.upsert({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
        create: { user1Id: u1, user2Id: u2 },
        update: {},
      });

      // 3. Setup mutual follows
      await tx.follow.upsert({
        where: { followerId_followingId: { followerId: senderId, followingId: receiverId } },
        create: { followerId: senderId, followingId: receiverId },
        update: {},
      });

      await tx.follow.upsert({
        where: { followerId_followingId: { followerId: receiverId, followingId: senderId } },
        create: { followerId: receiverId, followingId: senderId },
        update: {},
      });
    });

    await createAndPushNotification({
      receiverId: senderId,
      senderId: receiverId,
      type: 'FRIEND_ACCEPT',
      entityId: receiverId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Friend request accepted. You are now friends.',
    });
  } catch (error) {
    next(error);
  }
};

export const declineFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;
    const senderId = req.params.senderId;

    const request = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (!request || request.status !== 'PENDING') {
      return next(new NotFoundError('Pending friend request not found'));
    }

    // We can delete or update to DECLINED. Deleting is cleaner for retrying later.
    await prisma.friendRequest.delete({
      where: { id: request.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Friend request declined successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const unfriend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const friendId = req.params.friendId;

    const [u1, u2] = userId < friendId ? [userId, friendId] : [friendId, userId];

    const friendship = await prisma.friendship.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!friendship) {
      return next(new BadRequestError('You are not friends with this user'));
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete friendship
      await tx.friendship.delete({
        where: { id: friendship.id },
      });

      // 2. Delete friend request history
      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
      });

      // 3. Remove mutual follow (optional but common in social network unfriending)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId, followingId: friendId },
            { followerId: friendId, followingId: userId },
          ],
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'Unfriended successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getReceivedRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const receiverId = req.user!.id;

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId, status: RequestStatus.PENDING },
      include: {
        sender: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      sender: {
        id: r.sender.id,
        email: r.sender.email,
        profile: r.sender.profile,
      },
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;

    const requests = await prisma.friendRequest.findMany({
      where: { senderId, status: RequestStatus.PENDING },
      include: {
        receiver: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      receiver: {
        id: r.receiver.id,
        email: r.receiver.email,
        profile: r.receiver.profile,
      },
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};
