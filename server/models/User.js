const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  publicKey: {
    type: String,
    unique: true,
    sparse: true, // Allows null values, but still enforces uniqueness for non-null values
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'canceled', 'past_due', 'unpaid', 'trialing'],
    default: 'none'
  },
  subscriptionPlan: {
    type: String,
    enum: ['none', 'basic', 'professional', 'enterprise'],
    default: 'none'
  },
  subscriptionExpiresAt: {
    type: Date
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 