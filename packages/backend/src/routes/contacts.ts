import express from 'express';
import {
  getContacts,
  getPendingRequests,
  sendRequest,
  acceptRequest,
  blockContact,
  unblockContact,
  searchUsers
} from '../controllers/contacts';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user contacts
router.get('/', getContacts);

// Get pending contact requests
router.get('/requests/pending', getPendingRequests);

// Send contact request
router.post('/request/:userId', sendRequest);

// Accept contact request
router.put('/accept/:userId', acceptRequest);

// Block contact
router.put('/block/:userId', blockContact);

// Unblock contact
router.put('/unblock/:userId', unblockContact);

// Search users
router.get('/search', searchUsers);

export default router;
