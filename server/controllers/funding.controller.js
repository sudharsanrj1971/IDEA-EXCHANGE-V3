const Project = require('../models/Project.model');
const StakeholderInterest = require('../models/StakeholderInterest.model');
const notificationService = require('../services/notification.service');
const { success, error } = require('../utils/apiResponse');

exports.getFundingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ state: 'CERTIFIED', isActive: true })
      .populate('ownerId', 'name')
      .select('title problemStatement impactScore techStack certifiedAt collaborators');
    
    const formatted = projects.map(p => ({
      ...p._doc,
      problemStatement: p.problemStatement.substring(0, 200),
      collaboratorCount: p.collaborators.length
    }));

    success(res, { projects: formatted });
  } catch (err) {
    error(res, 'Error fetching funding opportunities', 500);
  }
};

exports.expressInterest = async (req, res) => {
  try {
    const { fundingAmount, purpose, milestones } = req.body;
    
    const interest = await StakeholderInterest.create({
      projectId: req.params.id,
      stakeholderId: req.user._id,
      fundingAmount,
      purpose,
      milestones
    });

    const project = await Project.findById(req.params.id);
    await notificationService.createNotification(
      project.ownerId,
      'STAKEHOLDER',
      `New funding interest in project ${project.title}`,
      { interestId: interest._id }
    );

    success(res, { interest }, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getProjectInterests = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    // Authorization: Admin or Owner
    if (req.user.role !== 'admin' && project.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Unauthorized', 403);
    }

    const interests = await StakeholderInterest.find({ projectId: req.params.id })
      .populate('stakeholderId', 'name institutionalEmail');
    
    success(res, { interests });
  } catch (err) {
    error(res, 'Error fetching interests', 500);
  }
};
