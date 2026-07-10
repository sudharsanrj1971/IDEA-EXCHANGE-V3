const mongoose = require('mongoose');

const governanceActionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  actionType: {
    type: String,
    enum: ['CHANGE_PROBLEM', 'ADD_STAKEHOLDER', 'CERTIFY', 'IP_DISPUTE'],
    required: true
  },
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requiredQuorum: {
    type: Number,
    default: 1
  },
  approvals: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  metadata: mongoose.Schema.Types.Mixed,
  executedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('GovernanceAction', governanceActionSchema);
