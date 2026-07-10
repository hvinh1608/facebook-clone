import { Response, NextFunction } from 'express';
import { prisma } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { AppError, BadRequestError, NotFoundError } from '../utils/errors';
import { canViewProfile } from '../utils/privacy';
import { uploadMediaFile } from '../utils/cloudinary';

export const getUserProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    // Check block status
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: id },
          { blockerId: id, blockedId: currentUserId },
        ],
      },
    });

    if (block) {
      return next(new NotFoundError('User profile not found (Blocked)'));
    }

    const allowed = await canViewProfile(currentUserId, id);
    if (!allowed) {
      return next(new NotFoundError('User profile not found'));
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Get friendships count (Since friendships are user1Id <-> user2Id, we need to count both sides)
    const friendsCount = await prisma.friendship.count({
      where: {
        OR: [
          { user1Id: id },
          { user2Id: id },
        ],
      },
    });

    // Check relationship status from current user's perspective
    let friendshipStatus: 'NONE' | 'FRIENDS' | 'SENT' | 'RECEIVED' = 'NONE';
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: id },
          { user1Id: id, user2Id: currentUserId },
        ],
      },
    });

    if (friendship) {
      friendshipStatus = 'FRIENDS';
    } else {
      const sentRequest = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: currentUserId, receiverId: id } },
      });
      const recvRequest = await prisma.friendRequest.findUnique({
        where: { senderId_receiverId: { senderId: id, receiverId: currentUserId } },
      });

      if (sentRequest && sentRequest.status === 'PENDING') {
        friendshipStatus = 'SENT';
      } else if (recvRequest && recvRequest.status === 'PENDING') {
        friendshipStatus = 'RECEIVED';
      }
    }

    const isFollowing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: id } },
    });

    const isOwnProfile = currentUserId === id;

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          ...(isOwnProfile && { email: user.email }),
          role: user.role,
          createdAt: user.createdAt,
          profile: user.profile,
          stats: {
            posts: user._count.posts,
            followers: user._count.followers,
            following: user._count.following,
            friends: friendsCount,
          },
          relationship: {
            friendshipStatus,
            isFollowing: !!isFollowing,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { displayName, bio, gender, dob, address, website, relationship } = req.body;

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        displayName,
        bio,
        gender,
        dob: dob ? new Date(dob) : undefined,
        address,
        website,
        relationship,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return next(new BadRequestError('Please upload an avatar image file'));
    }

    const avatarUrl = await uploadMediaFile(req.file, 'facebook/avatars');

    const profile = await prisma.profile.update({
      where: { userId },
      data: { avatarUrl },
    });

    res.status(200).json({
      status: 'success',
      message: 'Avatar updated successfully',
      data: { avatarUrl },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCover = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      return next(new BadRequestError('Please upload a cover image file'));
    }

    const coverUrl = await uploadMediaFile(req.file, 'facebook/covers');

    const profile = await prisma.profile.update({
      where: { userId },
      data: { coverUrl },
    });

    res.status(200).json({
      status: 'success',
      message: 'Cover image updated successfully',
      data: { coverUrl },
    });
  } catch (error) {
    next(error);
  }
};

export const followUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id;

    if (followerId === followingId) {
      return next(new BadRequestError('You cannot follow yourself'));
    }

    // Check block
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: followingId },
          { blockerId: followingId, blockedId: followerId },
        ],
      },
    });
    if (block) return next(new BadRequestError('Cannot follow a blocked user'));

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully followed user',
    });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const followerId = req.user!.id;
    const followingId = req.params.id;

    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blockerId = req.user!.id;
    const blockedId = req.params.id;

    if (blockerId === blockedId) {
      return next(new BadRequestError('You cannot block yourself'));
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Block relationship
      await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });

      // 2. Remove Friendship if exists
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { user1Id: blockerId, user2Id: blockedId },
            { user1Id: blockedId, user2Id: blockerId },
          ],
        },
      });

      // 3. Remove Friend Requests
      await tx.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      });

      // 4. Remove Follows
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });
    });

    res.status(200).json({
      status: 'success',
      message: 'User blocked successfully. Friendships and follows removed.',
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blockerId = req.user!.id;
    const blockedId = req.params.id;

    await prisma.block.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'User unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getFriendsList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: id },
          { user2Id: id },
        ],
      },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } },
      },
    });

    const friends = friendships.map((f) => {
      const friendUser = f.user1Id === id ? f.user2 : f.user1;
      return {
        id: friendUser.id,
        email: friendUser.email,
        profile: friendUser.profile,
      };
    });

    res.status(200).json({
      status: 'success',
      data: friends,
    });
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blockerId = req.user!.id;

    const blockedList = await prisma.block.findMany({
      where: { blockerId },
      include: {
        blocked: { include: { profile: true } },
      },
    });

    const users = blockedList.map((b) => ({
      id: b.blocked.id,
      email: b.blocked.email,
      profile: b.blocked.profile,
    }));

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user!.id;

    if (!q || typeof q !== 'string') {
      return next(new BadRequestError('Search query parameter "q" is required'));
    }

    // Save search history
    await prisma.searchHistory.create({
      data: {
        userId: currentUserId,
        query: q,
      },
    });

    // Find blocked users (we exclude them from search results)
    const blockedList = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: currentUserId },
          { blockedId: currentUserId },
        ],
      },
    });
    const blockedUserIds = blockedList.map((b) => b.blockerId === currentUserId ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...blockedUserIds],
        },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          {
            profile: {
              displayName: { contains: q, mode: 'insensitive' },
            },
          },
        ],
      },
      include: { profile: true },
      take: 20,
    });

    const results = users.map((u) => ({
      id: u.id,
      email: u.email,
      profile: u.profile,
    }));

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const getFriendSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;

    // Get current friends, requests, and blocked users to filter suggestions
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }] },
    });
    const friendIds = friendships.map((f) => f.user1Id === currentUserId ? f.user2Id : f.user1Id);

    const requests = await prisma.friendRequest.findMany({
      where: { OR: [{ senderId: currentUserId }, { receiverId: currentUserId }] },
    });
    const requestIds = requests.map((r) => r.senderId === currentUserId ? r.receiverId : r.senderId);

    const blockedList = await prisma.block.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
    });
    const blockedIds = blockedList.map((b) => b.blockerId === currentUserId ? b.blockedId : b.blockerId);

    const excludedIds = [currentUserId, ...friendIds, ...requestIds, ...blockedIds];

    // Find users not in excluded list
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        status: 'ACTIVE',
      },
      include: { profile: true },
      take: 10,
    });

    const suggestions = users.map((u) => ({
      id: u.id,
      email: u.email,
      profile: u.profile,
    }));

    res.status(200).json({
      status: 'success',
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

export const getSearchHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const uniqueQueries = [...new Set(history.map((h) => h.query))].slice(0, 10);

    res.status(200).json({
      status: 'success',
      data: uniqueQueries,
    });
  } catch (error) {
    next(error);
  }
};

export const clearSearchHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await prisma.searchHistory.deleteMany({ where: { userId } });
    res.status(200).json({ status: 'success', message: 'Search history cleared' });
  } catch (error) {
    next(error);
  }
};
