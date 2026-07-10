const Project = require('../models/Project.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const GovernanceAction = require('../models/GovernanceAction.model');
const ledgerService = require('./ledger.service');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

const VALID_TRANSITIONS = {
  SUBMITTED: ['COLLABORATING'],
  COLLABORATING: ['VALIDATING'],
  VALIDATING: ['CERTIFIED']
};

const PIS_THRESHOLD = parseFloat(process.env.INSTITUTION_PIS_THRESHOLD) || 7.0;

/**
 * Validates if the project meets the structural criteria for a state change.
 */
const checkEntryConditions = async (projectId, targetState) => {
  const project = await Project.findById(projectId);
  const missing = [];

  if (targetState === 'COLLABORATING') {
    if (project.collaborators.length < 1) missing.push('At least 1 collaborator required');
  }

  if (targetState === 'VALIDATING') {
    const contributors = await ContributionBlock.distinct('contributorId', { projectId });
    if (contributors.length < 3) missing.push('At least 3 distinct contributors required for validation phase');
  }

  if (targetState === 'CERTIFIED') {
    if (project.impactScore < PIS_THRESHOLD) missing.push(`Project Impact Score (${project.impactScore}) must be ≥ ${PIS_THRESHOLD}`);
    
    const certAction = await GovernanceAction.findOne({
      projectId,
      actionType: 'CERTIFY',
      status: 'APPROVED'
    });
    if (!certAction) missing.push('Approved CERTIFY governance action required');
  }

  return {
    met: missing.length === 0,
    missing
  };
};

/**
 * Transitions the project life cycle state and logs the transition into the ledger.
 */
const transitionState = async (projectId, targetState, actorId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  // 1. Check validity of transition path
  const allowed = VALID_TRANSITIONS[project.state] || [];
  if (!allowed.includes(targetState)) {
    throw new Error(`INVALID_TRANSITION: Cannot move from ${project.state} to ${targetState}`);
  }

  // 2. Check entry criteria
  const conditions = await checkEntryConditions(projectId, targetState);
  if (!conditions.met) {
    throw new Error(`CONDITIONS_NOT_MET: ${conditions.missing.join(', ')}`);
  }

  // 3. Apply changes
  const prevState = project.state;
  project.state = targetState;
  if (targetState === 'CERTIFIED') {
    project.certifiedAt = new Date();
  }
  await project.save();

  // 4. Ledger proof of transition
  await ledgerService.addBlock(projectId, actorId, {
    transition: {
      from: prevState,
      to: targetState,
      actorId,
      timestamp: Date.now()
    }
  }, 'DOCUMENTATION');

  await notificationService.broadcastToProject(projectId, 'GOVERNANCE', `Project moved to stage: ${targetState}`);
  logger.info(`Project ${projectId} transitioned ${prevState} -> ${targetState} by ${actorId}`);

  return project;
};

/**
 * Maps project states to available user actions.
 */
const getPermittedActions = (state) => {
  const permissions = {
    SUBMITTED: ['view', 'edit', 'requestReview'],
    COLLABORATING: ['addContribution', 'comment', 'forkBranch'],
    VALIDATING: ['expertReview', 'scoring', 'flagging'],
    CERTIFIED: ['publicFundingVisibility', 'portfolioExport']
  };
  return permissions[state] || [];
};

module.exports = {
  transitionState,
  getPermittedActions,
  checkEntryConditions
};
