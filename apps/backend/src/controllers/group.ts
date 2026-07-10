import { Response, NextFunction } from 'express';
import { prisma, GroupRole, GroupMemberStatus, Privacy } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { AppError, BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { uploadMediaFile } from '../utils/cloudinary';

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.user!.id;
    const { name, description, privacy } = req.body;

    if (!name) {
      return next(new BadRequestError('Group name is required'));
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        privacy: privacy || Privacy.PUBLIC,
        creatorId,
        members: {
          create: {
            userId: creatorId,
            role: GroupRole.ADMIN,
            status: GroupMemberStatus.APPROVED,
          },
        },
      },
      include: {
        members: { include: { user: { include: { profile: true } } } },
      },
    });

    res.status(201).json({
      status: 'success',
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: { include: { profile: true } },
        _count: {
          select: {
            members: { where: { status: GroupMemberStatus.APPROVED } },
            posts: true,
          },
        },
      },
    });

    if (!group) return next(new NotFoundError('Group not found'));

    // Check current user membership status
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: currentUserId } },
    });

    res.status(200).json({
      status: 'success',
      data: {
        group: {
          ...group,
          myMembership: membership || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { name, description, privacy } = req.body;

    // Check if user is group admin
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!member || member.role !== GroupRole.ADMIN || member.status !== GroupMemberStatus.APPROVED) {
      return next(new ForbiddenError('Only group administrators can modify group details'));
    }

    const updated = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        privacy,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroupImages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!member || member.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can change group images'));
    }

    if (!req.file) {
      return next(new BadRequestError('No image file uploaded'));
    }

    const type = req.body.type; // 'avatar' or 'cover'
    const imageUrl = await uploadMediaFile(req.file, 'facebook/groups');

    const dataUpdate: any = {};
    if (type === 'avatar') dataUpdate.avatarUrl = imageUrl;
    else if (type === 'cover') dataUpdate.coverUrl = imageUrl;
    else return next(new BadRequestError('Invalid update type'));

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: dataUpdate,
    });

    res.status(200).json({
      status: 'success',
      data: updatedGroup,
    });
  } catch (error) {
    next(error);
  }
};

export const joinGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return next(new NotFoundError('Group not found'));

    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (existingMember) {
      return next(new BadRequestError('You are already a member or have a pending request'));
    }

    // PUBLIC groups: approve immediately. PRIVATE groups: set PENDING
    const status = group.privacy === Privacy.PUBLIC ? GroupMemberStatus.APPROVED : GroupMemberStatus.PENDING;

    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId,
        status,
        role: GroupRole.MEMBER,
      },
    });

    res.status(201).json({
      status: 'success',
      message: status === GroupMemberStatus.APPROVED ? 'Successfully joined group' : 'Join request sent, waiting for approval',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!member) {
      return next(new BadRequestError('You are not a member of this group'));
    }

    if (member.role === GroupRole.ADMIN) {
      // If owner leaves, check if there are other admins or reject
      const otherAdmins = await prisma.groupMember.count({
        where: {
          groupId: id,
          role: GroupRole.ADMIN,
          userId: { not: userId },
        },
      });

      const totalMembers = await prisma.groupMember.count({
        where: { groupId: id, status: GroupMemberStatus.APPROVED },
      });

      if (totalMembers > 1 && otherAdmins === 0) {
        return next(new BadRequestError('You cannot leave as the sole admin. Appoint another admin first.'));
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully left the group',
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const members = await prisma.groupMember.findMany({
      where: { groupId: id, status: GroupMemberStatus.APPROVED },
      include: {
        user: { include: { profile: true } },
      },
    });

    res.status(200).json({
      status: 'success',
      data: members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        role: m.role,
        profile: m.user.profile,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });

    if (!member || member.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can view pending requests'));
    }

    const pending = await prisma.groupMember.findMany({
      where: { groupId: id, status: GroupMemberStatus.PENDING },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: pending.map((p) => ({
        id: p.user.id,
        email: p.user.email,
        profile: p.user.profile,
        requestedAt: p.joinedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const approveMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, targetUserId } = req.params;
    const adminId = req.user!.id;

    const adminMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can approve requests'));
    }

    await prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId: targetUserId } },
      data: { status: GroupMemberStatus.APPROVED },
    });

    res.status(200).json({
      status: 'success',
      message: 'Member approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const declineMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, targetUserId } = req.params;
    const adminId = req.user!.id;

    const adminMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can decline requests'));
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId: targetUserId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Request declined/removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, targetUserId } = req.params;
    const adminId = req.user!.id;

    if (adminId === targetUserId) {
      return next(new BadRequestError('You cannot remove yourself. Use leave group instead.'));
    }

    const adminMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can remove members'));
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId: targetUserId } },
    });

    res.status(200).json({
      status: 'success',
      message: 'Member removed from the group successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, targetUserId } = req.params;
    const { role } = req.body;
    const adminId = req.user!.id;

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return next(new BadRequestError('Role must be ADMIN or MEMBER'));
    }

    const adminMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: adminId } },
    });

    if (!adminMember || adminMember.role !== GroupRole.ADMIN) {
      return next(new ForbiddenError('Only group administrators can change member roles'));
    }

    const targetMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: targetUserId } },
    });

    if (!targetMember || targetMember.status !== GroupMemberStatus.APPROVED) {
      return next(new NotFoundError('Member not found'));
    }

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: id, userId: targetUserId } },
      data: { role: role as GroupRole },
      include: { user: { include: { profile: true } } },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupPosts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return next(new NotFoundError('Group not found'));

    // If private group, check if user is approved member
    if (group.privacy === Privacy.PRIVATE) {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId: currentUserId } },
      });
      if (!member || member.status !== GroupMemberStatus.APPROVED) {
        return next(new ForbiddenError('This group is private. You must join to view posts.'));
      }
    }

    const posts = await prisma.post.findMany({
      where: { groupId: id },
      include: {
        author: { include: { profile: true } },
        media: true,
        reactions: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = posts.map((post) => {
      const userReaction = post.reactions.find((r) => r.userId === currentUserId);
      return {
        ...post,
        hasReacted: !!userReaction,
        reactionType: userReaction ? userReaction.type : null,
      };
    });

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const getJoinedGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const memberships = await prisma.groupMember.findMany({
      where: { userId, status: GroupMemberStatus.APPROVED },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: { where: { status: GroupMemberStatus.APPROVED } },
              },
            },
          },
        },
      },
    });

    const groups = memberships.map((m) => m.group);

    res.status(200).json({
      status: 'success',
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

export const getExploreGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get groups I am already in (pending or approved)
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const joinedIds = memberships.map((m) => m.groupId);

    // Find other groups
    const groups = await prisma.group.findMany({
      where: {
        id: { notIn: joinedIds },
      },
      include: {
        _count: {
          select: {
            members: { where: { status: GroupMemberStatus.APPROVED } },
          },
        },
      },
      take: 10,
    });

    res.status(200).json({
      status: 'success',
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

export const searchGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return next(new BadRequestError('Search query parameter "q" is required'));
    }

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: {
            members: { where: { status: GroupMemberStatus.APPROVED } },
          },
        },
      },
      take: 20,
    });

    res.status(200).json({
      status: 'success',
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};
