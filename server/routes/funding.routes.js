const express = require('express');
const { body } = require('express-validator');
const fundingController = require('../controllers/funding.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.get('/projects', fundingController.getFundingProjects);

router.post('/projects/:id/interest', 
  verifyToken, 
  requireRole('stakeholder'), 
  validateObjectId(),
  [
    body('fundingAmount').isNumeric().withMessage('Funding amount must be numeric'),
    body('purpose').notEmpty().withMessage('Purpose is required')
  ],
  fundingController.expressInterest
);

router.get('/projects/:id/interests', 
  verifyToken, 
  validateObjectId(), 
  fundingController.getProjectInterests
);

module.exports = router;
