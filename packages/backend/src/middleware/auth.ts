import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'No user found with this id'
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    if (!roles.includes(req.user.id)) {
      res.status(403).json({
        success: false,
        error: `User role ${req.user.id} is not authorized to access this route`
      });
      return;
    }

    next();
  };
};
