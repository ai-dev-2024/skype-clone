import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/auth';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

export default router;
