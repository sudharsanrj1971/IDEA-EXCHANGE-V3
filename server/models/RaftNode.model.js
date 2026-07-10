const mongoose = require('mongoose');

const raftNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    unique: true,
    required: true
  },
  role: {
    type: String,
    enum: ['leader', 'follower', 'candidate'],
    default: 'follower'
  },
  term: {
    type: Number,
    default: 0
  },
  votedFor: {
    type: String,
    default: null
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  isAlive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RaftNode', raftNodeSchema);
