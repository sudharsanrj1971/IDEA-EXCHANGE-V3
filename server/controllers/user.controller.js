const mongoose = require('mongoose');
const User = require('../models/User.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const ReputationLog = require('../models/ReputationLog.model');
const reputationService = require('../services/reputation.service');
const { success, error } = require('../utils/apiResponse');

exports.getMe = async (req, res) => {
  success(res, { user: req.user });
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    success(res, { user });
  } catch (err) {
    error(res, 'Error fetching profile', 500);
  }
};

exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Aggregation for contribution stats
    const stats = await ContributionBlock.aggregate([
      { $match: { contributorId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: "$contributionType",
          count: { $sum: 1 }
      }}
    ]);

    const activeProjectIds = await ContributionBlock.distinct('projectId', { contributorId: userId });
    
    success(res, {
      stats,
      projectCount: activeProjectIds.length,
      userId
    });
  } catch (err) {
    error(res, 'Error fetching portfolio', 500);
  }
};

exports.getReputation = async (req, res) => {
  try {
    const logs = await ReputationLog.find({ userId: req.params.id }).sort({ createdAt: -1 });
    const user = await User.findById(req.params.id).select('reputationPoints');
    
    success(res, {
      logs,
      totalRP: user?.reputationPoints || 0
    });
  } catch (err) {
    error(res, 'Error fetching reputation', 500);
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await reputationService.getLeaderboard();
    success(res, { leaderboard });
  } catch (err) {
    error(res, 'Error fetching leaderboard', 500);
  }
};
