const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.get('/me', verifyToken, userController.getMe);
router.get('/leaderboard', userController.getLeaderboard);
router.get('/:id', verifyToken, validateObjectId(), userController.getUserProfile);
router.get('/:id/portfolio', verifyToken, validateObjectId(), userController.getPortfolio);
router.get('/:id/reputation', verifyToken, validateObjectId(), userController.getReputation);

module.exports = router;
