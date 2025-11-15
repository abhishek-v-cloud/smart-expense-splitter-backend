const Group = require('../models/Group');
const User = require('../models/User');

// Create a new group
const createGroup = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a group name',
      });
    }

    const group = await Group.create({
      name,
      description,
      category,
      createdBy: req.userId,
      members: [{ userId: req.userId }],
    });

    await group.populate('members.userId', 'name email');
    await group.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

// Get all groups for user
const getUserGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      'members.userId': req.userId,
      isActive: true,
    })
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    next(error);
  }
};

// Get single group
const getGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('members.userId', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId._id.toString() === req.userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this group',
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

// Add member to group
const addMember = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMember = group.members.some((m) => m.userId.toString() === user._id.toString());
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member',
      });
    }

    group.members.push({ userId: user._id });
    await group.save();
    await group.populate('members.userId', 'name email');
    await group.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

// Remove member from group
const removeMember = async (req, res, next) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    group.members = group.members.filter((m) => m.userId.toString() !== memberId);
    await group.save();
    await group.populate('members.userId', 'name email');
    await group.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroup,
  addMember,
  removeMember,
};
