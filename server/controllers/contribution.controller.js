const Project = require('../models/Project.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const ledgerService = require('../services/ledger.service');
const scoringService = require('../services/scoring.service');
const reputationService = require('../services/reputation.service');
const { success, error } = require('../utils/apiResponse');

exports.createContribution = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return error(res, 'Project not found', 404);

    if (project.state !== 'COLLABORATING') {
      return error(res, 'Contributions can only be added in COLLABORATING state', 400);
    }

    const { deltaData, contributionType } = req.body;
    
    // Add to ledger
    const block = await ledgerService.addBlock(
      project._id, 
      req.user._id, 
      deltaData, 
      contributionType
    );

    // Trigger asynchronous processes
    await scoringService.computeProjectPIS(project._id);
    await reputationService.checkAdoptionTrigger(block._id, project._id);
    await scoringService.detectCollusionPattern(project._id, block._id);

    success(res, { block }, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getProjectContributions = async (req, res) => {
  try {
    const chain = await ledgerService.getChain(req.params.id);
    success(res, { chain });
  } catch (err) {
    error(res, 'Error fetching ledger chain', 500);
  }
};

exports.getBlockDetails = async (req, res) => {
  try {
    const block = await ContributionBlock.findOne({ 
      projectId: req.params.id, 
      blockIndex: req.params.blockIndex 
    }).populate('contributorId', 'name institutionalEmail');
    
    if (!block) return error(res, 'Block not found', 404);

    const scoreStats = await scoringService.computeBlockScore(block._id);
    
    success(res, { 
      block,
      scoreDetails: scoreStats
    });
  } catch (err) {
    error(res, 'Error fetching block details', 500);
  }
};
