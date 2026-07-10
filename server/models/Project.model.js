const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required']
  },
  techStack: [String],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  state: {
    type: String,
    enum: ['SUBMITTED', 'COLLABORATING', 'VALIDATING', 'CERTIFIED'],
    default: 'SUBMITTED'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  impactScore: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  certifiedAt: Date
}, {
  timestamps: true
});

projectSchema.index({ ownerId: 1 });
projectSchema.index({ state: 1 });

module.exports = mongoose.model('Project', projectSchema);
