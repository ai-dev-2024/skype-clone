import express from 'express';
import { getUsers, getUserById, updateMyStatus } from '../controllers/users';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.put('/me/status', updateMyStatus);
router.get('/:userId', getUserById);

export default router;
