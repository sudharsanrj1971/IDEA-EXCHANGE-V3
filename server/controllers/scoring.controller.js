const Review = require('../models/Review.model');
const Upvote = require('../models/Upvote.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const scoringService = require('../services/scoring.service');
const reputationService = require('../services/reputation.service');
const { success, error } = require('../utils/apiResponse');

exports.getProjectScores = async (req, res) => {
  try {
    const pis = await scoringService.computeProjectPIS(req.params.id);
    const blocks = await ContributionBlock.find({ projectId: req.params.id }).sort({ blockIndex: 1 });
    
    const blockScores = await Promise.all(blocks.map(async (b) => ({
      blockIndex: b.blockIndex,
      score: await scoringService.computeBlockScore(b._id)
    })));

    success(res, { pis, blockScores, cachedAt: new Date() });
  } catch (err) {
    error(res, 'Error calculating scores', 500);
  }
};

exports.addReview = async (req, res) => {
  try {
    const { id, blockIndex } = req.params;
    const { score, comment, isSubstantive } = req.body;

    const block = await ContributionBlock.findOne({ projectId: id, blockIndex });
    if (!block) return error(res, 'Block not found', 404);

    const review = await Review.create({
      contributionBlockId: block._id,
      reviewerId: req.user._id,
      reviewerRole: req.user.role === 'faculty' || req.user.role === 'expert' ? 'expert' : 'peer',
      score,
      isSubstantive: isSubstantive || false
    });

    await scoringService.computeProjectPIS(id);
    
    if (review.reviewerRole === 'expert') {
      await reputationService.checkExpertAlignTrigger(block._id);
    }
    
    if (isSubstantive) {
      await reputationService.awardRP(req.user._id, id, 'PEER_REVIEW_SUBSTANTIVE');
    }

    success(res, { review }, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.addUpvote = async (req, res) => {
  try {
    const { id, blockIndex } = req.params;
    const block = await ContributionBlock.findOne({ projectId: id, blockIndex });
    if (!block) return error(res, 'Block not found', 404);

    // Initial weight check based on role/cohort happens in the Upvote model or scoring service
    // For now, simpler implementation
    const upvote = await Upvote.create({
      contributionBlockId: block._id,
      voterId: req.user._id,
      voterDepartment: req.user.department,
      voterBatchYear: req.user.batchYear
    });

    await scoringService.computeProjectPIS(id);
    await scoringService.detectCollusionPattern(id, block._id);

    success(res, { upvote }, 201);
  } catch (err) {
    if (err.code === 11000) return error(res, 'You have already upvoted this block', 409);
    error(res, err.message, 500);
  }
};
