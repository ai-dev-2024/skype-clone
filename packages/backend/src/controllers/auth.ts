import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/User';
import { AuthRequest } from '../types';

// Generate token response
const sendTokenResponse = (user: IUserDocument, statusCode: number, res: Response) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token
  user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, username, firstName, lastName, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email or username'
      });
      return;
    }

    // Create user
    const user = await User.create({
      email,
      username,
      firstName,
      lastName,
      password
    });

    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      username: req.body.username,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(req.user?.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    user.password = req.body.newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Logout user / clear refresh token
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);

    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token is required'
      });
      return;
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      // Get user and check if refresh token exists
      const user = await User.findById(decoded.id).select('+refreshTokens');

      if (!user || !user.refreshTokens.includes(refreshToken)) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
        return;
      }

      // Generate new tokens
      const newToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      // Remove old refresh token and save new one
      user.removeRefreshToken(refreshToken);
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
