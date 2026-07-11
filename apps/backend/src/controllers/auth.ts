import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from 'database';
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/jwt';
import { AppError, BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { AuthRequest } from '../middlewares/auth';
import crypto from 'crypto';
import { sendPasswordResetEmail, queueVerificationEmail } from '../utils/email';

// Helper: Generate tokens
const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign({ id: userId, email, role }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

async function completeAuthResponse(
  res: Response,
  user: { id: string; email: string; role: string; profile?: { displayName: string | null; avatarUrl: string | null } | null },
  statusCode = 200,
  message = 'Logged in successfully'
) {
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(statusCode).json({
    status: 'success',
    message,
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName,
        avatarUrl: user.profile?.avatarUrl,
      },
    },
  });
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return next(new ConflictError('Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User & Profile — Facebook-style: use app immediately, no email gate
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        isVerified: true,
        profile: {
          create: {
            displayName,
          },
        },
        userSettings: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    await completeAuthResponse(res, newUser, 201, 'Đăng ký thành công');
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token) {
      return next(new BadRequestError('Verification token is required'));
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return next(new BadRequestError('Invalid or expired verification token'));
    }

    if (user.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Email đã được xác minh trước đó. Bạn có thể đăng nhập.',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    res.status(200).json({
      status: 'success',
      message: 'Xác minh email thành công. Bạn có thể đăng nhập.',
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return next(new NotFoundError('Không tìm thấy tài khoản với email này'));
    }

    if (user.isVerified) {
      return res.status(200).json({
        status: 'success',
        message: 'Email đã được xác minh. Bạn có thể đăng nhập.',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    queueVerificationEmail(normalizedEmail, verificationUrl);

    res.status(200).json({
      status: 'success',
      message: 'Đã gửi lại email xác minh. Vui lòng kiểm tra hộp thư.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      return next(new UnauthorizedError('Incorrect email or password'));
    }

    if (user.status === 'BLOCKED') {
      return next(new AppError('Your account has been blocked', 403));
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return next(new UnauthorizedError('Incorrect email or password'));
    }

    await completeAuthResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      return next(new UnauthorizedError('Refresh token is required'));
    }

    const savedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { profile: true } } },
    });

    if (!savedToken || savedToken.expiresAt < new Date()) {
      if (savedToken) {
        await prisma.refreshToken.delete({ where: { token } });
      }
      return next(new UnauthorizedError('Invalid or expired refresh token'));
    }

    // Verify token structure
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new UnauthorizedError('Invalid refresh token'));
    }

    // Generate new access token
    const { accessToken } = generateTokens(savedToken.user.id, savedToken.user.email, savedToken.user.role);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        user: {
          id: savedToken.user.id,
          email: savedToken.user.email,
          role: savedToken.user.role,
          displayName: savedToken.user.profile?.displayName,
          avatarUrl: savedToken.user.profile?.avatarUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (token) {
      // Delete token from db
      await prisma.refreshToken.deleteMany({
        where: { token },
      });
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return next(new NotFoundError('No account with that email address exists'));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`📧 Password reset link for ${normalizedEmail}: ${resetUrl}`);
    void sendPasswordResetEmail(normalizedEmail, resetUrl).catch((error) => {
      console.error('Background password reset email failed:', error);
    });

    res.status(200).json({
      status: 'success',
      message: 'Link đặt lại mật khẩu đã được gửi tới email của bạn.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return next(new BadRequestError('Token is invalid or has expired'));
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return next(new BadRequestError('Incorrect current password'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(new BadRequestError('Google credential is required'));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return next(new BadRequestError('Google OAuth chưa được cấu hình trên server'));
    }

    const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!tokenRes.ok) {
      return next(new UnauthorizedError('Google token không hợp lệ'));
    }
    const payload = await tokenRes.json() as any;
    if (payload.aud !== clientId) {
      return next(new UnauthorizedError('Google token không khớp client ID'));
    }
    const normalizedEmail = payload.email?.toLowerCase()?.trim();
    const name = payload.name || payload.given_name || 'Người dùng Google';
    const picture: string | null = payload.picture || null;
    const sub: string | undefined = payload.sub;

    if (!normalizedEmail) {
      return next(new BadRequestError('Không lấy được email từ Google'));
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (!user) {
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(dummyPassword, 10);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          isVerified: true,
          profile: {
            create: {
              displayName: name,
              avatarUrl: picture,
            },
          },
        },
        include: { profile: true },
      });
    } else if (picture && !user.profile?.avatarUrl) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { avatarUrl: picture },
      });
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
    }

    if (!user) {
      return next(new NotFoundError('Không tìm thấy người dùng'));
    }

    if (user.status === 'BLOCKED') {
      return next(new AppError('Tài khoản của bạn đã bị khóa', 403));
    }

    await completeAuthResponse(res, user, 200, 'Đăng nhập Google thành công');
  } catch (error) {
    next(error);
  }
};
