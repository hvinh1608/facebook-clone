import { Response, NextFunction } from 'express';
import { prisma, UserStatus, ReportStatus } from 'database';
import { AuthRequest } from '../middlewares/auth';
import { BadRequestError, NotFoundError } from '../utils/errors';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const commentCount = await prisma.comment.count();
    const messageCount = await prisma.message.count();
    const groupCount = await prisma.group.count();
    const reportCount = await prisma.report.count({
      where: { status: ReportStatus.PENDING },
    });

    res.status(200).json({
      status: 'success',
      data: {
        users: userCount,
        posts: postCount,
        comments: commentCount,
        messages: messageCount,
        groups: groupCount,
        pendingReports: reportCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    const whereClause: any = {};
    if (q && typeof q === 'string') {
      whereClause.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      profile: u.profile,
      postCount: u._count.posts,
      followerCount: u._count.followers,
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

export const blockUserAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new NotFoundError('User not found'));

    if (user.role === 'ADMIN') {
      return next(new BadRequestError('You cannot block another administrator account'));
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BLOCKED },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    res.status(200).json({
      status: 'success',
      message: 'User account has been blocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const unblockUserAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new NotFoundError('User not found'));

    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    res.status(200).json({
      status: 'success',
      message: 'User account has been unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each report, we dynamically fetch target content to present detail to admin
    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        let targetContent: any = null;

        try {
          if (report.targetType === 'POST') {
            targetContent = await prisma.post.findUnique({
              where: { id: report.targetId },
              include: { author: { include: { profile: true } }, media: true },
            });
          } else if (report.targetType === 'COMMENT') {
            targetContent = await prisma.comment.findUnique({
              where: { id: report.targetId },
              include: { author: { include: { profile: true } } },
            });
          } else if (report.targetType === 'USER') {
            targetContent = await prisma.user.findUnique({
              where: { id: report.targetId },
              include: { profile: true },
            });
          } else if (report.targetType === 'GROUP') {
            targetContent = await prisma.group.findUnique({
              where: { id: report.targetId },
            });
          }
        } catch (e) {
          targetContent = { error: 'Target content deleted or inaccessible' };
        }

        return {
          ...report,
          reporterName: report.reporter.profile?.displayName,
          targetContent,
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: detailedReports,
    });
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return next(new NotFoundError('Report not found'));

    await prisma.report.update({
      where: { id },
      data: { status: ReportStatus.RESOLVED },
    });

    res.status(200).json({
      status: 'success',
      message: 'Report resolved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteViolationPost = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return next(new NotFoundError('Post not found'));

    // Cascade delete automatically deletes associated post media, comments, and reactions
    await prisma.post.delete({ where: { id: postId } });

    // Clean reports related to this post
    await prisma.report.updateMany({
      where: { targetType: 'POST', targetId: postId },
      data: { status: ReportStatus.RESOLVED },
    });

    res.status(200).json({
      status: 'success',
      message: 'Violation post deleted successfully and reports resolved',
    });
  } catch (error) {
    next(error);
  }
};
