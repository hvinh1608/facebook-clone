import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resendVerificationSchema = forgotPasswordSchema;

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
    bio: z.string().max(200, 'Bio must be under 200 characters').nullable().optional(),
    gender: z.string().nullable().optional(),
    dob: z.string().datetime().nullable().optional(),
    address: z.string().nullable().optional(),
    website: z.string().url('Invalid website URL').or(z.literal('')).nullable().optional(),
    relationship: z.string().nullable().optional(),
  }),
});

export const createPostSchema = z.object({
  body: z.object({
    content: z.string().optional(),
    privacy: z.enum(['PUBLIC', 'FRIENDS', 'ONLY_ME']).optional(),
    location: z.string().nullable().optional(),
    feeling: z.string().nullable().optional(),
    groupId: z.string().uuid().nullable().optional(),
  }),
});

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
    parentId: z.string().uuid().nullable().optional(),
  }),
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query cannot be empty'),
  }),
});
