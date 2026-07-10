const Project = require('../models/Project.model');
const User = require('../models/User.model');
const ledgerService = require('../services/ledger.service');
const scoringService = require('../services/scoring.service');
const stateMachineService = require('../services/stateMachine.service');
const { success, error } = require('../utils/apiResponse');

exports.createProject = async (req, res) => {
  try {
    const { title, problemStatement, techStack } = req.body;
    
    const project = await Project.create({
      title,
      problemStatement,
      techStack,
      ownerId: req.user._id
    });

    await ledgerService.createGenesisBlock(project._id, req.user._id);

    success(res, { project }, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { state, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (state) filter.state = state;
    filter.isActive = true;

    const projects = await Project.find(filter)
      .populate('ownerId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Project.countDocuments(filter);

    success(res, { projects, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    error(res, 'Error fetching projects', 500);
  }
};

exports.getProjectDetail = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('ownerId', 'name institutionalEmail reputationPoints')
      .populate('collaborators', 'name institutionalEmail department');
    
    if (!project) return error(res, 'Project not found', 404);

    // Dynamic PIS check
    const currentPIS = await scoringService.computeProjectPIS(project._id);

    success(res, { project, impactScore: currentPIS });
  } catch (err) {
    error(res, 'Error fetching project detail', 500);
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return error(res, 'Project not found', 404);

    if (project.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Only project owner can edit basic details', 403);
    }

    if (project.state !== 'SUBMITTED') {
      return error(res, 'Project details can only be updated in SUBMITTED state', 400);
    }

    const { title, problemStatement, techStack } = req.body;
    project.title = title || project.title;
    project.problemStatement = problemStatement || project.problemStatement;
    project.techStack = techStack || project.techStack;

    await project.save();
    success(res, { project });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.transitionState = async (req, res) => {
  try {
    const { targetState } = req.body;
    const project = await stateMachineService.transitionState(req.params.id, targetState, req.user._id);
    const permittedActions = stateMachineService.getPermittedActions(project.state);

    success(res, { project, permittedActions });
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.addCollaborator = async (req, res) => {
  try {
    const { institutionalEmail } = req.body;
    const project = await Project.findById(req.params.id);

    if (project.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Only owner can add collaborators', 403);
    }

    const userToAdd = await User.findOne({ institutionalEmail });
    if (!userToAdd) return error(res, 'User with this institutional email not found', 404);

    if (project.collaborators.includes(userToAdd._id)) {
      return error(res, 'User is already a collaborator', 400);
    }

    project.collaborators.push(userToAdd._id);
    await project.save();

    success(res, { project });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.softDeleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    success(res, { message: 'Project soft deleted', project });
  } catch (err) {
    error(res, 'Error deleting project', 500);
  }
};
