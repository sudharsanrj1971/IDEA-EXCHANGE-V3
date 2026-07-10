const express = require('express');
const { body } = require('express-validator');
const contributionController = require('../controllers/contribution.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const requireProjectAccess = require('../middleware/projectAccess.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(verifyToken);

/**
 * FIX 08: Ledger Access Control.
 * Only project owners and collaborators can append delta blocks.
 */
router.post('/projects/:id/contributions', 
  validateObjectId(),
  requireProjectAccess(), // Owner/Collaborator Only
  [
    body('deltaData').notEmpty().withMessage('Contribution payload cannot be empty'),
    body('contributionType').isIn(['ALGORITHM', 'RESEARCH', 'UIUX', 'DOCUMENTATION']).withMessage('Invalid contribution type')
  ],
  contributionController.createContribution
);

router.get('/projects/:id/contributions', 
  validateObjectId(), 
  requireProjectAccess({ allowStakeholder: true }), // Stakeholders can view if project is CERTIFIED
  contributionController.getProjectContributions
);

router.get('/projects/:id/contributions/:blockIndex', 
  validateObjectId(), 
  requireProjectAccess({ allowStakeholder: true }),
  contributionController.getBlockDetails
);

module.exports = router;
