const mongoose = require('mongoose');

const stakeholderInterestSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  stakeholderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fundingAmount: {
    type: Number,
    required: true
  },
  purpose: String,
  milestones: [String],
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StakeholderInterest', stakeholderInterestSchema);
