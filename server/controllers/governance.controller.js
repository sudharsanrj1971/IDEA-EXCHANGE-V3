const GovernanceAction = require('../models/GovernanceAction.model');
const tssService = require('../services/tss.service');
const { success, error } = require('../utils/apiResponse');

exports.proposeGovernanceAction = async (req, res) => {
  try {
    const { actionType, metadata } = req.body;
    const action = await tssService.proposeAction(
      req.params.id,
      actionType,
      req.user._id,
      metadata
    );
    success(res, { action }, 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.approveGovernanceAction = async (req, res) => {
  try {
    const action = await tssService.approveAction(req.params.actionId, req.user._id);
    success(res, { action });
  } catch (err) {
    error(res, err.message, 400);
  }
};

exports.rejectGovernanceAction = async (req, res) => {
  try {
    const action = await tssService.rejectAction(req.params.actionId, req.user._id);
    success(res, { action });
  } catch (err) {
    error(res, err.message, 500);
  }
};

exports.getPendingActions = async (req, res) => {
  try {
    const actions = await GovernanceAction.find({ 
      projectId: req.params.id, 
      status: 'PENDING' 
    }).populate('approvals.userId', 'name institutionalEmail');
    
    success(res, { actions });
  } catch (err) {
    error(res, 'Error fetching pending actions', 500);
  }
};
