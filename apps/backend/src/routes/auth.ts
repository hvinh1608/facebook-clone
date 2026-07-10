import { Router } from 'express';
import { signup, login, refreshToken, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, changePassword, googleLogin } from '../controllers/auth';
import { validate } from '../middlewares/validation';
import { protect } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimit';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, resendVerificationSchema, changePasswordSchema } from '../utils/validators';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), resendVerification);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/google-login', authLimiter, googleLogin);

// Protected routes
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;
