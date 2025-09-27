import express from 'express';
import {
  getMessages,
  getGroupMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
} from '../controllers/messages';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get group messages
router.get('/group/:groupId', getGroupMessages);

// Send message
router.post('/', sendMessage);

// Mark messages as read
router.put('/read', markAsRead);

// Get unread message count
router.get('/unread/count', getUnreadCount);

// Get messages between two users (must be last to avoid route conflicts)
router.get('/:userId', getMessages);

export default router;
