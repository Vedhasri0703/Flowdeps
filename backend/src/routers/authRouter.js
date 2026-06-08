import express from 'express';
import { 
    registerUser as register, 
    loginUser as login, 
    getUserProfile as getMe, 
    updateUserProfile as updateProfile,
    logoutUser as logout,
    verifyEmail as verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyResetToken,
    resendVerificationEmail
} from '../controllers/authController.js';
import { authMiddleware as protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);

export default router;