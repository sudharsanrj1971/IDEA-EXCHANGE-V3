const mongoose = require('mongoose');

const notificationEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['CONTRIBUTION', 'GOVERNANCE', 'TAMPER', 'SCORE_UPDATE', 'STAKEHOLDER'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

notificationEventSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('NotificationEvent', notificationEventSchema);
