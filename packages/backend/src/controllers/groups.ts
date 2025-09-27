import { Response } from 'express';
import Group from '../models/Group';
import { AuthRequest } from '../types';

// @desc    Get user groups
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.getUserGroups(req.user!.id);

    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('members', 'username firstName lastName avatar isOnline lastSeen')
      .populate('admins', 'username firstName lastName avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is a member
    if (!group.isMember(req.user!.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this group'
      });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, members, isPrivate } = req.body;

    const group = await Group.createGroup(
      name,
      description,
      req.user!.id,
      members || [],
      isPrivate || false
    );

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('members', 'username firstName lastName avatar isOnline lastSeen');

    res.status(201).json({
      success: true,
      data: populatedGroup
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:groupId
// @access  Private
export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.isAdmin(req.user!.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this group'
      });
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { name, description, avatar },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'username firstName lastName avatar')
    .populate('members', 'username firstName lastName avatar isOnline lastSeen');

    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members/:userId
// @access  Private
export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is admin
    if (!group.isAdmin(req.user!.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add members to this group'
      });
    }

    await group.addMember(userId);

    const updatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('members', 'username firstName lastName avatar isOnline lastSeen');

    res.status(200).json({
      success: true,
      data: updatedGroup
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is admin or removing themselves
    if (!group.isAdmin(req.user!.id) && userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove members from this group'
      });
    }

    await group.removeMember(userId);

    res.status(200).json({
      success: true,
      message: 'Member removed from group'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Leave group
// @route   DELETE /api/groups/:groupId/leave
// @access  Private
export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    await group.removeMember(req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Left group successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
