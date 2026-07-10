const mongoose = require('mongoose');

const upvoteSchema = new mongoose.Schema({
  contributionBlockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContributionBlock',
    required: true
  },
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  voterDepartment: String,
  voterBatchYear: Number,
  weight: {
    type: Number,
    default: 1.0
  }
}, {
  timestamps: true
});

upvoteSchema.index({ contributionBlockId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Upvote', upvoteSchema);
