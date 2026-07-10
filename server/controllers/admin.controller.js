const User = require('../models/User.model');
const Project = require('../models/Project.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const CollusionFlag = require('../models/CollusionFlag.model');
const NotificationEvent = require('../models/NotificationEvent.model');
const raftService = require('../services/raft.service');
const { success, error } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getAnalytics = async (req, res) => {
  try {
    const projectStats = await Project.aggregate([
      { $group: { _id: "$state", count: { $sum: 1 } } }
    ]);

    const userStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const avgContributions = await ContributionBlock.aggregate([
      { $group: { _id: "$projectId", count: { $sum: 1 } } },
      { $group: { _id: null, avg: { $avg: "$count" } } }
    ]);

    success(res, {
      projects: projectStats,
      users: userStats,
      avgContributions: avgContributions[0]?.avg || 0
    });
  } catch (err) {
    error(res, 'Error fetching analytics', 500);
  }
};

exports.getRaftStatus = async (req, res) => {
  try {
    const status = await raftService.getClusterStatus();
    success(res, { status });
  } catch (err) {
    error(res, 'Error fetching Raft status', 500);
  }
};

exports.simulateCrash = async (req, res) => {
  try {
    await raftService.simulateCrash(req.body.nodeId);
    success(res, { message: 'Crash simulation triggered' });
  } catch (err) {
    error(res, 'Error triggering crash', 500);
  }
};

exports.getFlags = async (req, res) => {
  try {
    const flags = await CollusionFlag.find({ status: 'OPEN' })
      .populate('projectId', 'title')
      .populate('flaggedUserIds', 'name institutionalEmail');
    success(res, { flags });
  } catch (err) {
    error(res, 'Error fetching flags', 500);
  }
};

exports.resolveFlag = async (req, res) => {
  try {
    const flag = await CollusionFlag.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', resolvedBy: req.user._id },
      { new: true }
    );
    success(res, { flag });
  } catch (err) {
    error(res, 'Error resolving flag', 500);
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await NotificationEvent.find({ type: 'TAMPER', isRead: false });
    success(res, { alerts });
  } catch (err) {
    error(res, 'Error fetching alerts', 500);
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);

    user.isBanned = !user.isBanned;
    await user.save();
    
    logger.warn(`SYBIL_ATTEMPT_BANNED: User ${user.institutionalEmail} status changed to ${user.isBanned}`);
    success(res, { user });
  } catch (err) {
    error(res, 'Error banning user', 500);
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    success(res, { user });
  } catch (err) {
    error(res, 'Error updating role', 500);
  }
};
