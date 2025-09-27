import express from 'express';
import {
  getUserGroups,
  getGroup,
  createGroup,
  updateGroup,
  addMember,
  removeMember,
  leaveGroup
} from '../controllers/groups';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user groups
router.get('/', getUserGroups);

// Get group by ID
router.get('/:groupId', getGroup);

// Create group
router.post('/', createGroup);

// Update group
router.put('/:groupId', updateGroup);

// Add member to group
router.post('/:groupId/members/:userId', addMember);

// Remove member from group
router.delete('/:groupId/members/:userId', removeMember);

// Leave group
router.delete('/:groupId/leave', leaveGroup);

export default router;
