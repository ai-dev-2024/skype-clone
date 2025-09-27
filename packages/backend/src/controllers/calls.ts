import { Response } from 'express';
import Call from '../models/Call';
import { AuthRequest } from '../types';

// @desc    Get call history
// @route   GET /api/calls/history
// @access  Private
export const getCallHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const calls = await Call.getCallHistory(
      req.user!.id,
      Number(limit),
      skip
    );

    res.status(200).json({
      success: true,
      data: calls
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get active calls
// @route   GET /api/calls/active
// @access  Private
export const getActiveCalls = async (req: AuthRequest, res: Response) => {
  try {
    const calls = await Call.getActiveCalls(req.user!.id);

    res.status(200).json({
      success: true,
      data: calls
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Initiate a call
// @route   POST /api/calls
// @access  Private
export const initiateCall = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId, type } = req.body;

    const call = await Call.create({
      callerId: req.user!.id,
      receiverId,
      groupId,
      type,
      status: 'initiated'
    });

    const populatedCall = await Call.findById(call._id)
      .populate('callerId', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      data: populatedCall
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Accept a call
// @route   PUT /api/calls/:callId/accept
// @access  Private
export const acceptCall = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    const call = await Call.updateCallStatus(callId, 'answered', {
      startTime: new Date()
    });

    res.status(200).json({
      success: true,
      data: call
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Decline a call
// @route   PUT /api/calls/:callId/decline
// @access  Private
export const declineCall = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    const call = await Call.updateCallStatus(callId, 'declined');

    res.status(200).json({
      success: true,
      data: call
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    End a call
// @route   PUT /api/calls/:callId/end
// @access  Private
export const endCall = async (req: AuthRequest, res: Response) => {
  try {
    const { callId } = req.params;

    const call = await Call.updateCallStatus(callId, 'ended', {
      endTime: new Date()
    });

    res.status(200).json({
      success: true,
      data: call
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
