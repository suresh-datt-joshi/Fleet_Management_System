import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/authValidator.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, authController.verifyOtp);
router.post('/resend-otp', authLimiter, resendOtpValidator, validate, authController.resendOtp);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.patch('/change-password', protect, changePasswordValidator, validate, authController.changePassword);

export default router;
