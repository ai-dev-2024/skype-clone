import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

// @desc    Get paginated list of users
// @route   GET /api/users
// @access  Private
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 20, status } = req.query;

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { username: regex },
        { email: regex },
        { firstName: regex },
        { lastName: regex }
      ];
    }

    if (status === 'online') {
      filter.isOnline = true;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username email firstName lastName avatar isOnline lastSeen createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get a single user by ID
// @route   GET /api/users/:userId
// @access  Private
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username email firstName lastName avatar isOnline lastSeen createdAt updatedAt');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update the authenticated user's presence/status
// @route   PUT /api/users/me/status
// @access  Private
export const updateMyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
      return;
    }

    const { isOnline, lastSeen } = req.body as { isOnline?: boolean; lastSeen?: string | Date };

    const updateData: Record<string, unknown> = {};

    if (typeof isOnline === 'boolean') {
      updateData.isOnline = isOnline;
      updateData.lastSeen = isOnline ? new Date() : (lastSeen ? new Date(lastSeen) : new Date());
    } else if (lastSeen) {
      updateData.lastSeen = new Date(lastSeen);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'No status changes provided'
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('username email firstName lastName avatar isOnline lastSeen updatedAt');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
