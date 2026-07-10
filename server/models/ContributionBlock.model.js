const mongoose = require('mongoose');

const contributionBlockSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  blockIndex: {
    type: Number,
    required: true
  },
  isGenesis: {
    type: Boolean,
    default: false
  },
  previousHash: {
    type: String,
    required: true
  },
  currentHash: {
    type: String,
    required: true
  },
  contributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deltaData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  contributionType: {
    type: String,
    enum: ['ALGORITHM', 'RESEARCH', 'UIUX', 'DOCUMENTATION'],
    required: true
  },
  complexityCoefficient: {
    type: Number,
    default: 1.0
  },
  timestamp: {
    type: Number,
    default: () => Date.now()
  },
  keyVersion: {
    type: String,
    default: 'v1'
  }
}, { timestamps: true });

// Prevent duplicate blocks in the same project chain
contributionBlockSchema.index({ projectId: 1, blockIndex: 1 }, { unique: true });

/**
 * FIX 04: NoSQL Injection Prevention
 * Recursively strip keys starting with '$' or containing '.' from deltaData payload.
 */
function sanitizePayload(obj) {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizePayload(obj[key]);
      }
    });
  }
}

contributionBlockSchema.pre('save', function(next) {
  if (this.deltaData) {
    sanitizePayload(this.deltaData);
  }
  next();
});

const ContributionBlock = mongoose.model('ContributionBlock', contributionBlockSchema);

module.exports = ContributionBlock;
