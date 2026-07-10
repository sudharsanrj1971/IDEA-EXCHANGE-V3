const ContributionBlock = require('../models/ContributionBlock.model');
const Review = require('../models/Review.model');
const Upvote = require('../models/Upvote.model');
const Project = require('../models/Project.model');
const CollusionFlag = require('../models/CollusionFlag.model');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');

// Map of contribution types to their base weights
const COMPLEXITY_MAP = { ALGORITHM: 1.0, RESEARCH: 0.8, UIUX: 0.6, DOCUMENTATION: 0.4 };
const SAME_COHORT_WEIGHT = 0.85;

/**
 * Checks if two users share the same institutional cohort.
 */
const isSameCohort = (v1Dept, v1Batch, v2Dept, v2Batch) => {
  return v1Dept === v2Dept && v1Batch === v2Batch;
};

/**
 * Calculates how often this block has been adopted/refined by later blocks.
 */
const computeAdoptionRate = async (blockId, projectId) => {
  const laterBlocks = await ContributionBlock.countDocuments({
    projectId,
    'deltaData.parentBlockIds': blockId
  });
  
  const totalLaterBlocks = await ContributionBlock.countDocuments({
    projectId,
    blockIndex: { $gt: (await ContributionBlock.findById(blockId)).blockIndex }
  });

  return totalLaterBlocks > 0 ? laterBlocks / totalLaterBlocks : 0;
};

/**
 * Computes the individual score for a single contribution block.
 */
const computeBlockScore = async (blockId) => {
  // Note: Redis caching would be implemented here in a full-scale env
  const block = await ContributionBlock.findById(blockId).populate('contributorId');
  const reviews = await Review.find({ contributionBlockId: blockId });
  const upvotes = await Upvote.find({ contributionBlockId: blockId });

  // 1. Peer Score (Upvotes with Cohort Weighting)
  let peerScore = 0;
  for (const vote of upvotes) {
    let weight = vote.weight || 1.0;
    if (isSameCohort(vote.voterDepartment, vote.voterBatchYear, block.contributorId.department, block.contributorId.batchYear)) {
      weight *= SAME_COHORT_WEIGHT;
    }
    peerScore += weight;
  }
  const normalizedPeer = Math.min(peerScore, 10); // Clamp or normalize logic

  // 2. Expert Rating
  const experts = reviews.filter(r => r.reviewerRole === 'expert');
  const expertRating = experts.length > 0 ? (experts.reduce((sum, r) => sum + r.score, 0) / experts.length) : 0;

  // 3. Coefficients
  const C = block.complexityCoefficient || 1.0;
  const adoptionRate = await computeAdoptionRate(blockId, block.projectId);

  // Formula: [(peer*0.6)+(expert*0.4)] * (C * (1+adoption))
  const rawScore = (normalizedPeer * 0.6 + expertRating * 0.4) * (C * (1 + adoptionRate));
  
  return parseFloat(rawScore.toFixed(2));
};

/**
 * Computes the Project Impact Score (PIS) with temporal decay.
 */
const computeProjectPIS = async (projectId) => {
  const project = await Project.findById(projectId);
  const blocks = await ContributionBlock.find({ projectId }).sort({ blockIndex: 1 });
  
  if (blocks.length === 0) return 0;

  const projectStart = new Date(project.createdAt).getTime();
  const now = Date.now();
  const projectAgeWeeks = Math.max(1, (now - projectStart) / (1000 * 60 * 60 * 24 * 7));

  let weightedScoreSum = 0;

  for (const block of blocks) {
    const score = await computeBlockScore(block._id);
    const blockTime = new Date(block.timestamp).getTime();
    
    // Time Decay: 0.5 to 1.0 based on how recent the block is
    const decay = 0.5 + 0.5 * ((blockTime - projectStart) / (now - projectStart));
    weightedScoreSum += score * Math.max(0.5, Math.min(1.0, decay));
  }

  const pis = parseFloat((weightedScoreSum / projectAgeWeeks).toFixed(2));
  
  // Persist and notify
  await Project.findByIdAndUpdate(projectId, { impactScore: pis });
  await notificationService.broadcastToProject(projectId, 'SCORE_UPDATE', `Project Impact Score updated: ${pis}`);

  return pis;
};

/**
 * Invalidation stub for cache-heavy environments.
 */
const invalidateProjectCache = async (projectId) => {
  logger.info(`Invalidating score cache for project ${projectId}`);
  // Redis.del(`score:project:${projectId}`)
};

/**
 * Heuristic to detect cohort-based upvote manipulation.
 */
const detectCollusionPattern = async (projectId, blockId) => {
  const oneHourAgo = new Date(Date.now() - 3600000);
  const upvotes = await Upvote.find({
    contributionBlockId: blockId,
    createdAt: { $gte: oneHourAgo }
  });

  const cohorts = {};
  for (const vote of upvotes) {
    const key = `${vote.voterDepartment}:${vote.voterBatchYear}`;
    cohorts[key] = (cohorts[key] || 0) + 1;
    
    if (cohorts[key] >= 3) {
      await CollusionFlag.create({
        projectId,
        contributionBlockId: blockId,
        reason: `Hyper-local voting detected from cohort ${key}`,
        status: 'OPEN'
      });
      
      logger.warn(`Collusion potential detected for project ${projectId} in cohort ${key}`);
      return true;
    }
  }
  
  return false;
};

module.exports = {
  computeBlockScore,
  computeProjectPIS,
  invalidateProjectCache,
  detectCollusionPattern
};
