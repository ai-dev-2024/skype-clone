import express from 'express';
import {
  getCallHistory,
  getActiveCalls,
  initiateCall,
  acceptCall,
  declineCall,
  endCall
} from '../controllers/calls';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get call history
router.get('/history', getCallHistory);

// Get active calls
router.get('/active', getActiveCalls);

// Initiate a call
router.post('/', initiateCall);

// Accept a call
router.put('/:callId/accept', acceptCall);

// Decline a call
router.put('/:callId/decline', declineCall);

// End a call
router.put('/:callId/end', endCall);

export default router;
