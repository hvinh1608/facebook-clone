import { Response, NextFunction } from 'express';
import { prisma, MediaType } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { emitToConversation } from '../socket';
import { createAndPushNotification } from '../utils/notifications';
import { canSendMessage } from '../utils/privacy';
import { uploadMediaFile } from '../utils/cloudinary';

export const getConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.conversationMember.findMany({
      where: { userId, leftAt: null },
      include: {
        conversation: {
          include: {
            members: {
              where: { leftAt: null },
              include: { user: { include: { profile: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversations = memberships.map((m) => {
      const conv = m.conversation;
      const lastMessage = conv.messages[0] || null;

      // Filter members to get other members details
      const otherMembers = conv.members.filter((member) => member.userId !== userId);
      const myMemberDetails = conv.members.find((member) => member.userId === userId);

      return {
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        creatorId: conv.creatorId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage,
        members: conv.members.map((member) => ({
          userId: member.user.id,
          displayName: member.user.profile?.displayName,
          avatarUrl: member.user.profile?.avatarUrl,
          isAdmin: member.isAdmin,
        })),
        chatPartner: !conv.isGroup && otherMembers[0] ? {
          userId: otherMembers[0].user.id,
          displayName: otherMembers[0].user.profile?.displayName,
          avatarUrl: otherMembers[0].user.profile?.avatarUrl,
        } : null,
        myRole: myMemberDetails ? { isAdmin: myMemberDetails.isAdmin } : null,
      };
    });

    res.status(200).json({
      status: 'success',
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    // Check membership
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!member || member.leftAt) {
      return next(new ForbiddenError('You are not a member of this conversation'));
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { include: { profile: true } },
        replyTo: {
          include: {
            sender: { include: { profile: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    let nextCursor: string | undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    res.status(200).json({
      status: 'success',
      data: {
        messages: messages.reverse(),
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user!.id;
    const { name, isGroup, userIds } = req.body; // userIds is array of member IDs

    if (!isGroup) {
      // 1-1 Conversation
      const targetUserId = userIds[0];
      if (!targetUserId) return next(new BadRequestError('Target user ID is required'));

      if (currentUserId === targetUserId) {
        return next(new BadRequestError('Cannot start a chat with yourself'));
      }

      const allowed = await canSendMessage(currentUserId, targetUserId);
      if (!allowed) {
        return next(new ForbiddenError('You cannot message this user based on their privacy settings'));
      }

      // Check if 1-1 conversation already exists
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: targetUserId } } },
          ],
        },
        include: {
          members: { include: { user: { include: { profile: true } } } },
        },
      });

      if (existing) {
        return res.status(200).json({
          status: 'success',
          data: existing,
        });
      }

      // Create new 1-1
      const conv = await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: currentUserId },
              { userId: targetUserId },
            ],
          },
        },
        include: {
          members: { include: { user: { include: { profile: true } } } },
        },
      });

      return res.status(201).json({
        status: 'success',
        data: conv,
      });
    } else {
      // Group Conversation
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return next(new BadRequestError('Group must have at least one other member'));
      }

      const allMembers = [currentUserId, ...userIds];
      
      const conv = await prisma.conversation.create({
        data: {
          name: name || 'Group Chat',
          isGroup: true,
          creatorId: currentUserId,
          members: {
            create: allMembers.map((uid) => ({
              userId: uid,
              isAdmin: uid === currentUserId,
            })),
          },
        },
        include: {
          members: { include: { user: { include: { profile: true } } } },
        },
      });

      return res.status(201).json({
        status: 'success',
        data: conv,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const { conversationId } = req.params;
    const { content, replyToId } = req.body;

    // Check membership
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!member || member.leftAt) {
      return next(new ForbiddenError('You are not a member of this conversation'));
    }

    let mediaUrl: string | undefined = undefined;
    let mediaType: MediaType | undefined = undefined;

    if (req.file) {
      mediaUrl = await uploadMediaFile(req.file, 'facebook/messages');
      mediaType = req.file.mimetype.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE;
    }

    if (!content && !mediaUrl) {
      return next(new BadRequestError('Message cannot be empty'));
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        mediaUrl,
        mediaType,
        replyToId: replyToId || null,
        deliveredAt: new Date(),
      },
      include: {
        sender: { include: { profile: true } },
        replyTo: {
          include: {
            sender: { include: { profile: true } },
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Emit Realtime event via Socket.IO
    emitToConversation(conversationId, 'message:received', message);

    const otherMembers = await prisma.conversationMember.findMany({
      where: { conversationId, userId: { not: senderId }, leftAt: null },
      select: { userId: true },
    });

    await Promise.all(
      otherMembers.map((m) =>
        createAndPushNotification({
          receiverId: m.userId,
          senderId,
          type: 'NEW_MESSAGE',
          entityId: conversationId,
        })
      )
    );

    res.status(201).json({
      status: 'success',
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return next(new NotFoundError('Message not found'));

    if (message.senderId !== userId) {
      return next(new ForbiddenError('You can only delete your own messages'));
    }

    await prisma.message.delete({ where: { id } });

    // Emit event
    emitToConversation(message.conversationId, 'message:deleted', { messageId: id });

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const markMessagesRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member || member.leftAt) {
      return next(new ForbiddenError('You are not a member of this conversation'));
    }

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.status(200).json({ status: 'success', message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

export const addGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const { conversationId } = req.params;
    const { userIds } = req.body; // Array of user IDs to add

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new BadRequestError('User IDs are required'));
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) return next(new NotFoundError('Conversation not found'));

    if (!conv.isGroup) {
      return next(new BadRequestError('Cannot add members to a 1-1 conversation'));
    }

    // Check if operator is Admin
    const operator = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: adminId } },
    });
    if (!operator || !operator.isAdmin) {
      return next(new ForbiddenError('Only group admins can add new members'));
    }

    // Add members
    const newMembers = await prisma.$transaction(
      userIds.map((uid) =>
        prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId, userId: uid } },
          create: { conversationId, userId: uid },
          update: { leftAt: null }, // Reactivate if left
        })
      )
    );

    // Emit event
    emitToConversation(conversationId, 'group:members-added', { userIds });

    res.status(200).json({
      status: 'success',
      message: 'Members added successfully',
      data: newMembers,
    });
  } catch (error) {
    next(error);
  }
};

export const removeGroupMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const { conversationId, targetUserId } = req.params;

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) return next(new NotFoundError('Conversation not found'));

    if (adminId === targetUserId) {
      return next(new BadRequestError('You cannot remove yourself. Leave conversation instead.'));
    }

    // Check operator role
    const operator = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: adminId } },
    });
    if (!operator || !operator.isAdmin) {
      return next(new ForbiddenError('Only group admins can remove members'));
    }

    // Mark user as left / delete member record
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
      data: { leftAt: new Date() },
    });

    // Emit event
    emitToConversation(conversationId, 'group:member-removed', { targetUserId });

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
