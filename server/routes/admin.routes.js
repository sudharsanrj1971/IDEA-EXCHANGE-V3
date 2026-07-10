const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/analytics', adminController.getAnalytics);
router.get('/raft/status', adminController.getRaftStatus);
router.post('/raft/simulate-crash', adminController.simulateCrash);
router.get('/flags', adminController.getFlags);
router.patch('/flags/:id', validateObjectId(), adminController.resolveFlag);
router.get('/alerts', adminController.getAlerts);
router.patch('/users/:id/ban', validateObjectId(), adminController.banUser);
router.patch('/users/:id/role', validateObjectId(), adminController.updateUserRole);

module.exports = router;
