const express = require('express');
const { body } = require('express-validator');
const scoringController = require('../controllers/scoring.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.get('/projects/:id/score', validateObjectId(), scoringController.getProjectScores);

router.post('/projects/:id/contributions/:blockIndex/review', 
  verifyToken, 
  validateObjectId(),
  [
    body('score').isInt({ min: 0, max: 10 }).withMessage('Score must be between 0 and 10'),
    body('isSubstantive').optional().isBoolean()
  ],
  scoringController.addReview
);

router.post('/projects/:id/contributions/:blockIndex/upvote', 
  verifyToken, 
  validateObjectId(),
  scoringController.addUpvote
);

module.exports = router;
