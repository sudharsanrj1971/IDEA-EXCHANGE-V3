const User = require('../models/User.model');
const ReputationLog = require('../models/ReputationLog.model');
const Review = require('../models/Review.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const logger = require('../utils/logger');

const RP_TABLE = {
  CONTRIBUTION_ADOPTED: 15,
  PEER_REVIEW_SUBSTANTIVE: 8,
  EXPERT_ALIGN: 20,
  CONFLICT_RESOLVED: 12
};

/**
 * Awards Reputation Points to a user.
 */
const awardRP = async (userId, projectId, event) => {
  try {
    const points = RP_TABLE[event];
    if (!points) throw new Error('Invalid event for awarding RP');

    const log = await ReputationLog.create({
      userId,
      projectId,
      event,
      pointsAwarded: points
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { reputationPoints: points } },
      { new: true }
    );

    logger.info(`Awarded ${points} RP to User ${userId} for ${event}`);
    return updatedUser;
  } catch (err) {
    logger.error('Error in awardRP:', err);
    throw err;
  }
};

/**
 * Checks if a contribution has been referenced enough to trigger an adoption award.
 */
const checkAdoptionTrigger = async (blockId, projectId) => {
  const block = await ContributionBlock.findById(blockId);
  if (!block) return;

  const count = await ContributionBlock.countDocuments({
    projectId,
    blockIndex: { $gt: block.blockIndex },
    'deltaData.parentBlockIds': blockId
  });

  // Threshold of 2 references for the first time
  if (count === 2) {
    await awardRP(block.contributorId, projectId, 'CONTRIBUTION_ADOPTED');
  }
};

/**
 * Awards RP if an expert review aligns closely with peer sentiment.
 */
const checkExpertAlignTrigger = async (blockId) => {
  const reviews = await Review.find({ contributionBlockId: blockId });
  const expertReviews = reviews.filter(r => r.reviewerRole === 'expert');
  const peerReviews = reviews.filter(r => r.reviewerRole === 'peer');

  if (expertReviews.length === 0 || peerReviews.length === 0) return;

  const meanPeer = peerReviews.reduce((sum, r) => sum + r.score, 0) / peerReviews.length;

  for (const expertReview of expertReviews) {
    if (Math.abs(expertReview.score - meanPeer) <= 1.5) {
      await awardRP(expertReview.reviewerId, null, 'EXPERT_ALIGN');
    }
  }
};

/**
 * Fetches the student leaderboard.
 */
const getLeaderboard = async () => {
  return await User.find({ role: 'student' })
    .sort({ reputationPoints: -1 })
    .limit(20)
    .select('name department batchYear reputationPoints');
};

module.exports = {
  awardRP,
  checkAdoptionTrigger,
  checkExpertAlignTrigger,
  getLeaderboard
};
