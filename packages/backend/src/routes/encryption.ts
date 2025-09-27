import express from 'express';
import { body, param } from 'express-validator';
import { User } from '@skype-clone/shared';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import UserModel from '../models/User';

const router = express.Router();

// All encryption routes require authentication
router.use(protect);

// Update user public key
router.put('/public-key', [
  body('publicKey').isString().notEmpty().withMessage('Public key is required'),
  body('publicKeyFingerprint').isString().notEmpty().withMessage('Public key fingerprint is required'),
  validateRequest,
], async (req, res) => {
  try {
    const { publicKey, publicKeyFingerprint } = req.body;
    const userId = (req as any).user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.publicKey = publicKey;
    user.publicKeyFingerprint = publicKeyFingerprint;
    await user.save();

    res.json({
      success: true,
      message: 'Public key updated successfully',
      data: {
        publicKey: user.publicKey,
        publicKeyFingerprint: user.publicKeyFingerprint
      }
    });
  } catch (error: any) {
    console.error('Update public key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update public key'
    });
  }
});

// Get user public key
router.get('/public-key/:userId', [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
], async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId).select('publicKey publicKeyFingerprint');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId,
        publicKey: user.publicKey,
        publicKeyFingerprint: user.publicKeyFingerprint
      }
    });
  } catch (error: any) {
    console.error('Get public key error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get public key'
    });
  }
});

// Get multiple users' public keys
router.post('/public-keys', [
  body('userIds').isArray().withMessage('User IDs array is required'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
], async (req, res) => {
  try {
    const { userIds } = req.body;

    const users = await UserModel.find({
      _id: { $in: userIds }
    }).select('_id publicKey publicKeyFingerprint');

    const publicKeys = users.map(user => ({
      userId: user._id.toString(),
      publicKey: user.publicKey,
      publicKeyFingerprint: user.publicKeyFingerprint
    }));

    res.json({
      success: true,
      data: publicKeys
    });
  } catch (error: any) {
    console.error('Get public keys error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get public keys'
    });
  }
});

// Validate public key fingerprint
router.post('/validate-fingerprint', [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('fingerprint').isString().notEmpty().withMessage('Fingerprint is required'),
  validateRequest,
], async (req, res) => {
  try {
    const { userId, fingerprint } = req.body;

    const user = await UserModel.findById(userId).select('publicKeyFingerprint');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const isValid = user.publicKeyFingerprint === fingerprint;

    res.json({
      success: true,
      data: {
        userId,
        isValid,
        expectedFingerprint: user.publicKeyFingerprint
      }
    });
  } catch (error: any) {
    console.error('Validate fingerprint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate fingerprint'
    });
  }
});

export default router;
