const express = require('express');
const { body } = require('express-validator');
const governanceController = require('../controllers/governance.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.post('/projects/:id/propose', 
  verifyToken, 
  validateObjectId(),
  [
    body('actionType').isIn(['CHANGE_PROBLEM', 'ADD_STAKEHOLDER', 'CERTIFY', 'IP_DISPUTE']).withMessage('Invalid action type')
  ],
  governanceController.proposeGovernanceAction
);

router.post('/projects/:id/actions/:actionId/approve', 
  verifyToken, 
  validateObjectId(),
  validateObjectId('actionId'),
  governanceController.approveGovernanceAction
);

router.post('/projects/:id/actions/:actionId/reject', 
  verifyToken, 
  validateObjectId(),
  validateObjectId('actionId'),
  governanceController.rejectGovernanceAction
);

router.get('/projects/:id/pending', validateObjectId(), governanceController.getPendingActions);

module.exports = router;
