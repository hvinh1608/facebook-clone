import { Response, NextFunction } from 'express';
import { prisma, Privacy, MediaType, ReactionType, ReportTargetType } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { createAndPushNotification } from '../utils/notifications';
import { uploadMediaFile } from '../utils/cloudinary';

export const postInclude = {
  author: { include: { profile: true } },
  group: true,
  media: true,
  sharedPost: {
    include: {
      author: { include: { profile: true } },
      media: true,
      _count: { select: { comments: true } },
    },
  },
  reactions: {
    select: { id: true, userId: true, type: true },
  },
  _count: { select: { comments: true, reactions: true } },
};

type PollOptionData = { id: string; text: string; voterIds: string[] };

function normalizePollInput(pollOptions: unknown): PollOptionData[] | undefined {
  if (!pollOptions) return undefined;
  let raw: unknown = pollOptions;
  if (typeof pollOptions === 'string') {
    try {
      raw = JSON.parse(pollOptions);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(raw) || raw.length < 2) return undefined;

  if (typeof raw[0] === 'string') {
    return (raw as string[]).filter(Boolean).map((text, i) => ({
      id: String(i),
      text,
      voterIds: [],
    }));
  }

  return (raw as PollOptionData[]).map((o, i) => ({
    id: o.id ?? String(i),
    text: o.text,
    voterIds: Array.isArray(o.voterIds) ? o.voterIds : [],
  }));
}

function normalizePollFromDb(pollOptions: unknown): PollOptionData[] {
  return normalizePollInput(pollOptions) || [];
}

const publishedOnlyFilter = {
  OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
};

export const createPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user!.id;
    const { content, privacy, location, feeling, groupId, audienceUserIds, excludedUserIds, scheduledAt, isPoll, pollOptions } = req.body;

    const parseIds = (val: unknown): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) {
        try { return JSON.parse(val); } catch { return []; }
      }
      return [];
    };

    const audienceIds = parseIds(audienceUserIds);
    const excludedIds = parseIds(excludedUserIds);
    const pollData = normalizePollInput(pollOptions);

    // Check if group posting is allowed
    if (groupId) {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: authorId } },
      });
      if (!member || member.status !== 'APPROVED') {
        return next(new ForbiddenError('You must be a member of the group to post.'));
      }
    }

    const post = await prisma.post.create({
      data: {
        authorId,
        content,
        privacy: privacy || Privacy.PUBLIC,
        audienceUserIds: audienceIds,
        excludedUserIds: excludedIds,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        isPoll: isPoll === true || isPoll === 'true',
        pollOptions: pollData || undefined,
        location,
        feeling,
        groupId,
      },
    });

    // Handle Uploaded Media
    if (req.files && Array.isArray(req.files)) {
      const mediaData = await Promise.all(req.files.map(async (file: any) => {
        const type = file.mimetype.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE;
        return {
          postId: post.id,
          type,
          url: await uploadMediaFile(file, 'facebook/posts'),
        };
      }));

      if (mediaData.length > 0) {
        await prisma.postMedia.createMany({
          data: mediaData,
        });
      }
    }

    const fullPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: postInclude,
    });

    res.status(201).json({
      status: 'success',
      data: fullPost,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string; // Optional cursor for pagination (post ID)
    const sort = (req.query.sort as string) === 'top' ? 'top' : 'recent';

    // Get friend list to filter feed
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }] },
    });
    const friendIds = friendships.map((f) => f.user1Id === currentUserId ? f.user2Id : f.user1Id);

    // Users the current user follows
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);
    const followingOnlyIds = followingIds.filter((id) => id !== currentUserId && !friendIds.includes(id));

    // Groups the user has joined (approved members)
    const joinedMemberships = await prisma.groupMember.findMany({
      where: { userId: currentUserId, status: 'APPROVED' },
      select: { groupId: true },
    });
    const joinedGroupIds = joinedMemberships.map((m) => m.groupId);

    // Block list
    const blockedList = await prisma.block.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
    });
    const blockedUserIds = blockedList.map((b) => b.blockerId === currentUserId ? b.blockedId : b.blockerId);

    // Feed conditions:
    // 1. My own posts (non-group)
    // 2. Friends' posts with PUBLIC or FRIENDS privacy
    // 3. Followed users' public posts (+ FRIENDS if also friends)
    // 4. Anyone's public posts
    // 5. Posts from groups the user has joined
    // 6. Exclude blocked users' posts
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          publishedOnlyFilter,
          buildFeedWhere(currentUserId, friendIds, followingOnlyIds, followingIds, joinedGroupIds, blockedUserIds),
        ],
      },
      include: postInclude,
      orderBy: sort === 'top' ? { reactions: { _count: 'desc' } } : { createdAt: 'desc' },
      take: limit + 1, // Get 1 extra to check for next page
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: currentUserId },
      select: { postId: true },
    });
    const savedPostIds = new Set(savedPosts.map((s) => s.postId));

    const canViewPost = (post: {
      authorId: string;
      privacy: Privacy;
      excludedUserIds?: string[];
      audienceUserIds?: string[];
    }) => {
      if (post.authorId === currentUserId) return true;
      if (post.privacy === Privacy.PUBLIC) return true;
      if (post.privacy === Privacy.ONLY_ME) return false;
      const isFriend = friendIds.includes(post.authorId);
      if (post.privacy === Privacy.FRIENDS) return isFriend;
      if (post.privacy === Privacy.FRIENDS_EXCEPT) {
        return isFriend && !(post.excludedUserIds || []).includes(currentUserId);
      }
      if (post.privacy === Privacy.SPECIFIC_FRIENDS) {
        return (post.audienceUserIds || []).includes(currentUserId);
      }
      return false;
    };

    const visiblePosts = posts.filter(canViewPost);

    const formattedPosts = visiblePosts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === currentUserId);
      return {
        ...post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
        isSaved: savedPostIds.has(post.id),
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts: formattedPosts,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const postId = req.params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: postInclude,
    });

    if (!post) {
      return next(new NotFoundError('Post not found'));
    }

    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: post.authorId },
          { blockerId: post.authorId, blockedId: currentUserId },
        ],
      },
    });

    if (isBlocked) {
      return next(new NotFoundError('Post not found'));
    }

    let canView = post.privacy === Privacy.PUBLIC;

    if (post.authorId === currentUserId) {
      canView = true;
    } else if (post.privacy === Privacy.FRIENDS) {
      const isFriend = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: post.authorId },
            { user1Id: post.authorId, user2Id: currentUserId },
          ],
        },
      });
      canView = !!isFriend;
    } else if (post.privacy === Privacy.ONLY_ME) {
      canView = false;
    }

    if (!canView) {
      return next(new ForbiddenError('You do not have permission to view this post'));
    }

    if (post.scheduledAt && post.scheduledAt > new Date() && post.authorId !== currentUserId) {
      return next(new NotFoundError('Post not found'));
    }

    const userReaction = post.reactions.find((r) => r.userId === currentUserId);
    const saved = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: currentUserId, postId } },
    });

    res.status(200).json({
      status: 'success',
      data: {
        ...post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
        isSaved: !!saved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const targetUserId = req.params.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string;

    // Check blocked status
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: currentUserId, blockedId: targetUserId },
          { blockerId: targetUserId, blockedId: currentUserId },
        ],
      },
    });

    if (isBlocked) {
      return next(new NotFoundError('Posts not found (Blocked)'));
    }

    // Determine privacy access level
    let allowedPrivacies: Privacy[] = [Privacy.PUBLIC];

    if (currentUserId === targetUserId) {
      allowedPrivacies = [Privacy.PUBLIC, Privacy.FRIENDS, Privacy.ONLY_ME];
    } else {
      // Check if friends
      const isFriend = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: currentUserId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: currentUserId },
          ],
        },
      });
      if (isFriend) {
        allowedPrivacies = [Privacy.PUBLIC, Privacy.FRIENDS];
      }
    }

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          publishedOnlyFilter,
          {
            authorId: targetUserId,
            privacy: { in: allowedPrivacies },
            groupId: null,
          },
        ],
      },
      include: {
        author: { include: { profile: true } },
        media: true,
        reactions: {
          include: { user: { include: { profile: true } } },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    const formattedPosts = posts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === currentUserId);
      return {
        ...post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        posts: formattedPosts,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content, privacy, location, feeling } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return next(new NotFoundError('Post not found'));

    if (post.authorId !== userId) {
      return next(new ForbiddenError('You can only edit your own posts'));
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content,
        privacy,
        location,
        feeling,
      },
      include: {
        author: { include: { profile: true } },
        media: true,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Post updated successfully',
      data: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return next(new NotFoundError('Post not found'));

    // Creator or Admin can delete
    if (post.authorId !== userId && userRole !== 'ADMIN') {
      return next(new ForbiddenError('You are not authorized to delete this post'));
    }

    await prisma.post.delete({ where: { id } });

    res.status(200).json({
      status: 'success',
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const savePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;

    await prisma.savedPost.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });

    res.status(200).json({
      status: 'success',
      message: 'Post saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const unsavePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;

    await prisma.savedPost.delete({
      where: { userId_postId: { userId, postId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Post removed from saved posts',
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const saved = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            media: true,
            reactions: true,
            _count: { select: { comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const posts = saved.map((s) => {
      const userReaction = s.post.reactions.find((r) => r.userId === userId);
      return {
        ...s.post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
      };
    });

    res.status(200).json({
      status: 'success',
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

export const reportPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user!.id;
    const postId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return next(new BadRequestError('Reason is required for submitting a report'));
    }

    await prisma.report.create({
      data: {
        reporterId,
        targetType: ReportTargetType.POST,
        targetId: postId,
        reason,
      },
    });

    // Mark post reported state
    await prisma.post.update({
      where: { id: postId },
      data: { isReported: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Post reported successfully. Our team will review it.',
    });
  } catch (error) {
    next(error);
  }
};

// --- Reactions ---

export const reactPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;
    const { type } = req.body; // ReactionType enum

    if (!type || !Object.values(ReactionType).includes(type)) {
      return next(new BadRequestError('Invalid reaction type'));
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle reaction off
        await prisma.reaction.delete({
          where: { postId_userId: { postId, userId } },
        });
        return res.status(200).json({
          status: 'success',
          message: 'Reaction removed',
          data: { hasReacted: false, reactionType: null },
        });
      } else {
        // Update reaction type
        const updated = await prisma.reaction.update({
          where: { postId_userId: { postId, userId } },
          data: { type },
        });
        return res.status(200).json({
          status: 'success',
          message: 'Reaction updated',
          data: { hasReacted: true, reactionType: updated.type },
        });
      }
    }

    // Create new reaction
    const newReaction = await prisma.reaction.create({
      data: { postId, userId, type },
    });

    if (targetPost && targetPost.authorId !== userId) {
      await createAndPushNotification({
        receiverId: targetPost.authorId,
        senderId: userId,
        type: 'LIKE',
        entityId: postId,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Reaction added',
      data: { hasReacted: true, reactionType: newReaction.type },
    });
  } catch (error) {
    next(error);
  }
};

// --- Comments ---

export const createComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authorId = req.user!.id;
    const postId = req.params.postId;
    const { content, parentId } = req.body;

    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentId,
      },
      include: {
        author: { include: { profile: true } },
      },
    });

    if (targetPost && targetPost.authorId !== authorId) {
      await createAndPushNotification({
        receiverId: targetPost.authorId,
        senderId: authorId,
        type: 'COMMENT',
        entityId: postId,
      });
    }

    res.status(201).json({
      status: 'success',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPostComments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;

    // Get parent comments (parentId = null) and include replies
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { include: { profile: true } },
        replies: {
          include: {
            author: { include: { profile: true } },
            reactions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format to indicate user reactions
    const currentUserId = req.user!.id;
    const formatComments = comments.map((c) => {
      const userReaction = c.reactions.find((r) => r.userId === currentUserId);
      return {
        ...c,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
        replies: c.replies.map((reply) => {
          const repReaction = reply.reactions.find((r) => r.userId === currentUserId);
          return {
            ...reply,
            hasReacted: !!repReaction,
            reactionType: repReaction ? repReaction.type : null,
          };
        }),
      };
    });

    res.status(200).json({
      status: 'success',
      data: formatComments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return next(new NotFoundError('Comment not found'));

    if (comment.authorId !== userId) {
      return next(new ForbiddenError('You can only edit your own comments'));
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
      include: { author: { include: { profile: true } } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Comment updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return next(new NotFoundError('Comment not found'));

    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      return next(new ForbiddenError('You are not authorized to delete this comment'));
    }

    await prisma.comment.delete({ where: { id } });

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reactComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const commentId = req.params.id;
    const { type } = req.body;

    if (!type || !Object.values(ReactionType).includes(type)) {
      return next(new BadRequestError('Invalid reaction type'));
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        await prisma.commentReaction.delete({
          where: { commentId_userId: { commentId, userId } },
        });
        return res.status(200).json({
          status: 'success',
          message: 'Comment reaction removed',
          data: { hasReacted: false, reactionType: null },
        });
      } else {
        const updated = await prisma.commentReaction.update({
          where: { commentId_userId: { commentId, userId } },
          data: { type },
        });
        return res.status(200).json({
          status: 'success',
          message: 'Comment reaction updated',
          data: { hasReacted: true, reactionType: updated.type },
        });
      }
    }

    const newReaction = await prisma.commentReaction.create({
      data: { commentId, userId, type },
    });

    res.status(200).json({
      status: 'success',
      message: 'Comment reaction added',
      data: { hasReacted: true, reactionType: newReaction.type },
    });
  } catch (error) {
    next(error);
  }
};

async function buildFeedVisibility(currentUserId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1Id: currentUserId }, { user2Id: currentUserId }] },
  });
  const friendIds = friendships.map((f) => (f.user1Id === currentUserId ? f.user2Id : f.user1Id));

  const follows = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const followingIds = follows.map((f) => f.followingId);
  const followingOnlyIds = followingIds.filter((id) => id !== currentUserId && !friendIds.includes(id));

  const joinedMemberships = await prisma.groupMember.findMany({
    where: { userId: currentUserId, status: 'APPROVED' },
    select: { groupId: true },
  });
  const joinedGroupIds = joinedMemberships.map((m) => m.groupId);

  const blockedList = await prisma.block.findMany({
    where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
  });
  const blockedUserIds = blockedList.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId));

  return { currentUserId, friendIds, followingOnlyIds, followingIds, joinedGroupIds, blockedUserIds };
}

function buildFeedWhere(
  currentUserId: string,
  friendIds: string[],
  followingOnlyIds: string[],
  followingIds: string[],
  joinedGroupIds: string[],
  blockedUserIds: string[],
  extra?: object
) {
  return {
    authorId: { notIn: blockedUserIds },
    ...extra,
    OR: [
      {
        groupId: null,
        OR: [
          { authorId: currentUserId },
          { authorId: { in: friendIds }, privacy: { in: [Privacy.PUBLIC, Privacy.FRIENDS] } },
          { authorId: { in: followingOnlyIds }, privacy: Privacy.PUBLIC },
          {
            authorId: { in: followingIds.filter((id) => friendIds.includes(id)) },
            privacy: { in: [Privacy.PUBLIC, Privacy.FRIENDS] },
          },
          { privacy: Privacy.PUBLIC },
        ],
      },
      ...(joinedGroupIds.length > 0 ? [{ groupId: { in: joinedGroupIds } }] : []),
    ],
  };
}

export const getWatchPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentUserId, friendIds, followingOnlyIds, followingIds, joinedGroupIds, blockedUserIds } =
      await buildFeedVisibility(req.user!.id);
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string;

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          publishedOnlyFilter,
          buildFeedWhere(currentUserId, friendIds, followingOnlyIds, followingIds, joinedGroupIds, blockedUserIds, {
            media: { some: { type: MediaType.VIDEO } },
          }),
        ],
      },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem!.id;
    }

    const canViewPost = (post: {
      authorId: string;
      privacy: Privacy;
      excludedUserIds?: string[];
      audienceUserIds?: string[];
    }) => {
      if (post.authorId === currentUserId) return true;
      if (post.privacy === Privacy.PUBLIC) return true;
      if (post.privacy === Privacy.ONLY_ME) return false;
      const isFriend = friendIds.includes(post.authorId);
      if (post.privacy === Privacy.FRIENDS) return isFriend;
      if (post.privacy === Privacy.FRIENDS_EXCEPT) {
        return isFriend && !(post.excludedUserIds || []).includes(currentUserId);
      }
      if (post.privacy === Privacy.SPECIFIC_FRIENDS) {
        return (post.audienceUserIds || []).includes(currentUserId);
      }
      return false;
    };

    const visiblePosts = posts.filter(canViewPost);

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: currentUserId },
      select: { postId: true },
    });
    const savedPostIds = new Set(savedPosts.map((s) => s.postId));

    const formattedPosts = visiblePosts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === currentUserId);
      return {
        ...post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
        isSaved: savedPostIds.has(post.id),
      };
    });

    res.status(200).json({
      status: 'success',
      data: { posts: formattedPosts, nextCursor },
    });
  } catch (error) {
    next(error);
  }
};

export const votePoll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const postId = req.params.id;
    const { optionId } = req.body;

    if (!optionId) return next(new BadRequestError('optionId là bắt buộc'));

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || !post.isPoll) {
      return next(new NotFoundError('Không tìm thấy bình chọn'));
    }

    const options = normalizePollFromDb(post.pollOptions);
    if (!options.some((o) => o.id === optionId)) {
      return next(new BadRequestError('Lựa chọn không hợp lệ'));
    }

    const updatedOptions = options.map((o) => ({
      ...o,
      voterIds: (o.voterIds || []).filter((id) => id !== userId),
    }));

    const targetIdx = updatedOptions.findIndex((o) => o.id === optionId);
    updatedOptions[targetIdx].voterIds.push(userId);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { pollOptions: updatedOptions },
      include: postInclude,
    });

    const userReaction = updated.reactions.find((r) => r.userId === userId);

    res.status(200).json({
      status: 'success',
      data: {
        ...updated,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
        myPollVote: optionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getScheduledPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
        scheduledAt: { gt: new Date() },
      },
      include: postInclude,
      orderBy: { scheduledAt: 'asc' },
    });

    res.status(200).json({ status: 'success', data: posts });
  } catch (error) {
    next(error);
  }
};

export const sharePost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const originalPostId = req.params.id;
    const { content, privacy, groupId } = req.body;

    const original = await prisma.post.findUnique({ where: { id: originalPostId } });
    if (!original) return next(new NotFoundError('Post not found'));

    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: original.authorId },
          { blockerId: original.authorId, blockedId: userId },
        ],
      },
    });
    if (isBlocked) return next(new NotFoundError('Post not found'));

    let canView = original.privacy === Privacy.PUBLIC || original.authorId === userId;
    if (!canView && original.privacy === Privacy.FRIENDS) {
      const isFriend = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: original.authorId },
            { user1Id: original.authorId, user2Id: userId },
          ],
        },
      });
      canView = !!isFriend;
    }
    if (!canView) return next(new ForbiddenError('You cannot share this post'));

    if (groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (!membership) return next(new ForbiddenError('You are not a member of this group'));
    }

    const shared = await prisma.post.create({
      data: {
        authorId: userId,
        content: content?.trim() || null,
        privacy: groupId ? Privacy.PUBLIC : (privacy || Privacy.PUBLIC),
        sharedPostId: originalPostId,
        groupId: groupId || null,
      },
      include: postInclude,
    });

    if (original.authorId !== userId) {
      await createAndPushNotification({
        receiverId: original.authorId,
        senderId: userId,
        type: 'SHARE',
        entityId: shared.id,
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        ...shared,
        hasReacted: false,
        reactionType: null,
        isSaved: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q?.trim()) return next(new BadRequestError('Search query is required'));

    const posts = await prisma.post.findMany({
      where: {
        AND: [
          publishedOnlyFilter,
          {
            content: { contains: q, mode: 'insensitive' },
            privacy: Privacy.PUBLIC,
          },
        ],
      },
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(200).json({ status: 'success', data: posts });
  } catch (error) {
    next(error);
  }
};
