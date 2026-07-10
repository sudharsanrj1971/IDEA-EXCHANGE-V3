const GovernanceAction = require('../models/GovernanceAction.model');
const Project = require('../models/Project.model');
const ContributionBlock = require('../models/ContributionBlock.model');
const notificationService = require('./notification.service');
const logger = require('../utils/logger');

// Circular dependency handling: stateMachineService is loaded on demand
let stateMachineService;
const getStateMachine = () => {
  if (!stateMachineService) stateMachineService = require('./stateMachine.service');
  return stateMachineService;
};

/**
 * Computes the required quorum for a given number of authors (n/2 + 1).
 */
const computeQuorum = (n) => {
  return Math.ceil(n / 2) + 1;
};

/**
 * Proposes a new governance action involving the multi-signature of project authors.
 */
const proposeAction = async (projectId, actionType, proposedBy, metadata = {}) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');

  // Fetch unique authors across the ledger
  const authorIds = await ContributionBlock.distinct('contributorId', { projectId });
  const quorum = computeQuorum(authorIds.length);

  const action = await GovernanceAction.create({
    projectId,
    actionType,
    proposedBy,
    requiredQuorum: quorum,
    metadata,
    status: 'PENDING'
  });

  // Notify all authors that their approval is required
  for (const authorId of authorIds) {
    await notificationService.createNotification(
      authorId,
      'GOVERNANCE',
      `TSS approval required for project governance: ${actionType}`,
      { actionId: action._id, projectId }
    );
  }

  logger.info(`Governance action ${actionType} proposed for project ${projectId}. Quorum required: ${quorum}`);
  return action;
};

/**
 * Adds an approval from an author to a pending action.
 */
const approveAction = async (actionId, approverId) => {
  const action = await GovernanceAction.findById(actionId);
  if (!action) throw new Error('Action not found');
  if (action.status !== 'PENDING') throw new Error('Action is already resolved');

  // Check if already approved
  const alreadyApproved = action.approvals.some(a => a.userId.toString() === approverId.toString());
  if (alreadyApproved) throw new Error('Already approved by this user');

  action.approvals.push({ userId: approverId, approvedAt: new Date() });

  if (action.approvals.length >= action.requiredQuorum) {
    return await executeAction(action);
  } else {
    await action.save();
    return action;
  }
};

/**
 * Executes the logic of a governance action once quorum is met.
 */
const executeAction = async (action) => {
  const project = await Project.findById(action.projectId);
  const ledgerService = require('./ledger.service');

  switch (action.actionType) {
    case 'CHANGE_PROBLEM':
      project.problemStatement = action.metadata.newProblemStatement;
      break;
    case 'ADD_STAKEHOLDER':
      if (action.metadata.stakeholderId) {
        project.collaborators.push(action.metadata.stakeholderId);
      }
      break;
    case 'CERTIFY':
      await getStateMachine().transitionState(project._id, 'CERTIFIED', action.proposedBy);
      break;
    case 'IP_DISPUTE':
      project.isActive = false;
      // Notify all admins of the dispute
      const admins = await require('../models/User.model').find({ role: 'admin' });
      for (const admin of admins) {
        await notificationService.createNotification(admin._id, 'TAMPER', `IP Dispute triggered for project: ${project.title}`, { projectId: project._id });
      }
      break;
    default:
      throw new Error('Unknown action type');
  }

  await project.save();

  action.status = 'APPROVED';
  action.executedAt = new Date();
  await action.save();

  // Log to ledger
  await ledgerService.addBlock(project._id, action.proposedBy, {
    governance: {
      actionId: action._id,
      type: action.actionType,
      status: 'APPROVED'
    }
  }, 'DOCUMENTATION');

  // Broadcast to project room
  // In a real app, io.to(projectId).emit(...)
  logger.info(`Governance action ${action.actionType} executed for project ${project._id}`);
  
  return action;
};

/**
 * Rejects a governance action.
 */
const rejectAction = async (actionId, rejecterId) => {
  const action = await GovernanceAction.findById(actionId);
  if (!action) throw new Error('Action not found');

  action.status = 'REJECTED';
  await action.save();

  logger.info(`Governance action ${actionId} rejected by ${rejecterId}`);
  return action;
};

module.exports = {
  proposeAction,
  approveAction,
  executeAction,
  rejectAction
};
