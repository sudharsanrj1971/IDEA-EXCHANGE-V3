const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  contributionBlockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContributionBlock',
    required: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerRole: {
    type: String,
    enum: ['peer', 'expert'],
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  isSubstantive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
