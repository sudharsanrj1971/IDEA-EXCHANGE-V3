const mongoose = require('mongoose');

const reputationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  event: {
    type: String,
    enum: ['CONTRIBUTION_ADOPTED', 'PEER_REVIEW_SUBSTANTIVE', 'EXPERT_ALIGN', 'CONFLICT_RESOLVED'],
    required: true
  },
  pointsAwarded: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReputationLog', reputationLogSchema);
