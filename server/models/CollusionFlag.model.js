const mongoose = require('mongoose');

const collusionFlagSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  contributionBlockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContributionBlock'
  },
  flaggedUserIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reason: String,
  scoreBefore: Number,
  scoreAfter: Number,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['OPEN', 'RESOLVED'],
    default: 'OPEN'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollusionFlag', collusionFlagSchema);
