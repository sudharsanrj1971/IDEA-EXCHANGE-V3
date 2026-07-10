const express = require('express');
const { body, validationResult } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');
const { error } = require('../utils/apiResponse');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return error(res, errors.array()[0].msg, 400);
  next();
};

router.post('/', 
  verifyToken, 
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('problemStatement').notEmpty().withMessage('Problem statement is required'),
    body('techStack').isArray().withMessage('Tech stack must be an array')
  ],
  validate,
  projectController.createProject
);

router.get('/', projectController.getProjects);

router.get('/:id', validateObjectId(), projectController.getProjectDetail);

router.patch('/:id', 
  verifyToken, 
  validateObjectId(),
  [
    body('title').optional().notEmpty(),
    body('problemStatement').optional().notEmpty(),
    body('techStack').optional().isArray()
  ],
  validate,
  projectController.updateProject
);

router.patch('/:id/state', verifyToken, validateObjectId(), projectController.transitionState);

router.post('/:id/collaborators', 
  verifyToken, 
  validateObjectId(),
  [body('institutionalEmail').isEmail()],
  validate,
  projectController.addCollaborator
);

router.delete('/:id', verifyToken, requireRole('admin'), validateObjectId(), projectController.softDeleteProject);

module.exports = router;
