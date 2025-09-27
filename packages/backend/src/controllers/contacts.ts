import { Response } from 'express';
import Contact from '../models/Contact';
import User from '../models/User';
import { AuthRequest } from '../types';

// @desc    Get user contacts
// @route   GET /api/contacts
// @access  Private
export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await Contact.getUserContacts(req.user!.id);

    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get pending contact requests
// @route   GET /api/contacts/requests/pending
// @access  Private
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await Contact.getPendingRequests(req.user!.id);

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Send contact request
// @route   POST /api/contacts/request/:userId
// @access  Private
export const sendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if trying to add self
    if (userId === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot add yourself as a contact'
      });
    }

    const contact = await Contact.sendRequest(req.user!.id, userId);

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact request sent'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Accept contact request
// @route   PUT /api/contacts/accept/:userId
// @access  Private
export const acceptRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const contact = await Contact.acceptRequest(req.user!.id, userId);

    res.status(200).json({
      success: true,
      data: contact,
      message: 'Contact request accepted'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Block contact
// @route   PUT /api/contacts/block/:userId
// @access  Private
export const blockContact = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const contact = await Contact.blockContact(req.user!.id, userId);

    res.status(200).json({
      success: true,
      data: contact,
      message: 'Contact blocked'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Unblock contact
// @route   PUT /api/contacts/unblock/:userId
// @access  Private
export const unblockContact = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    await Contact.unblockContact(req.user!.id, userId);

    res.status(200).json({
      success: true,
      message: 'Contact unblocked'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/contacts/search
// @access  Private
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user!.id } // Exclude current user
    })
    .select('username firstName lastName avatar isOnline lastSeen')
    .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
