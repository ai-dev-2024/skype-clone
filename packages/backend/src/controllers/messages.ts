import { Response } from 'express';
import Message from '../models/Message';
import { AuthRequest } from '../types';

// @desc    Get messages between two users
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.getConversation(
      req.user!.id,
      userId,
      Number(limit),
      skip
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get group messages
// @route   GET /api/messages/group/:groupId
// @access  Private
export const getGroupMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.getGroupMessages(
      groupId,
      Number(limit),
      skip
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId, content, type, fileUrl, fileName, fileSize } = req.body;

    const message = await Message.create({
      senderId: req.user!.id,
      receiverId,
      groupId,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      fileSize
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messageIds must be a non-empty array'
      });
    }

    await Message.markAsRead(messageIds, req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user!.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
