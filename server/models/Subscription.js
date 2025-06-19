const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial'],
    default: 'trial'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  trialEndsAt: {
    type: Date
  },
  features: {
    maxElections: {
      type: Number,
      required: true
    },
    maxVoters: {
      type: Number,
      required: true
    },
    analytics: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  billing: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    nextBillingDate: Date,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'crypto'],
      required: true
    },
    lastPaymentDate: Date,
    lastPaymentAmount: Number
  },
  usage: {
    electionsCreated: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Add index for efficient querying
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() <= this.endDate;
};

// Method to check if subscription is in trial
subscriptionSchema.methods.isTrial = function() {
  return this.status === 'trial' && new Date() <= this.trialEndsAt;
};

// Method to check if subscription can be renewed
subscriptionSchema.methods.canRenew = function() {
  return ['active', 'expired'].includes(this.status);
};

// Method to check if subscription has exceeded limits
subscriptionSchema.methods.hasExceededLimits = function() {
  return (
    this.usage.electionsCreated >= this.features.maxElections ||
    this.usage.totalVotes >= this.features.maxVoters
  );
};

module.exports = mongoose.model('Subscription', subscriptionSchema); 