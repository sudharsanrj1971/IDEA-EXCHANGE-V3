const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  institutionalEmail: {
    type: String,
    required: [true, 'Institutional email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid institutional email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  studentId: String,
  department: String,
  batchYear: Number,
  role: {
    type: String,
    enum: ['student', 'faculty', 'expert', 'admin', 'stakeholder'],
    default: 'student'
  },
  reputationPoints: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.index({ institutionalEmail: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
