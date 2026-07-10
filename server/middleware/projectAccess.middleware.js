const Project = require('../models/Project.model');
const { error } = require('../utils/apiResponse');

/**
 * Enforces project-level access control.
 * @param {Object} options 
 * @param {boolean} options.allowStakeholder - if true, stakeholders can view if project is CERTIFIED
 */
const requireProjectAccess = (options = { allowStakeholder: false }) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.id || req.body.projectId;
      const project = await Project.findById(projectId);

      if (!project) {
        return error(res, 'Project not found', 404);
      }

      const userId = req.user._id.toString();
      const isOwner = project.ownerId.toString() === userId;
      const isCollaborator = project.collaborators.some(id => id.toString() === userId);
      const isStakeholderAccess = options.allowStakeholder && 
                                 req.user.role === 'stakeholder' && 
                                 project.state === 'CERTIFIED';

      if (!isOwner && !isCollaborator && !isStakeholderAccess && req.user.role !== 'admin') {
        return error(res, 'Access denied: You are not a participant in this project', 403);
      }

      // Attach to request for controllers
      req.project = project;
      req.isOwner = isOwner;
      req.isCollaborator = isCollaborator;

      next();
    } catch (err) {
      error(res, 'Authorization check failed', 500);
    }
  };
};

module.exports = requireProjectAccess;
