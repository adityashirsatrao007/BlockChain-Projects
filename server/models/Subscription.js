const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
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
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
    default: 'active'
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date
  },
  trialEnd: {
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
    maxCandidates: {
      type: Number,
      required: true
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Methods
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' || this.status === 'trialing';
};

subscriptionSchema.methods.isTrial = function() {
  return this.status === 'trialing' && this.trialEnd > new Date();
};

subscriptionSchema.methods.isCanceled = function() {
  return this.cancelAtPeriodEnd || this.status === 'canceled';
};

subscriptionSchema.methods.isPastDue = function() {
  return this.status === 'past_due';
};

subscriptionSchema.methods.isUnpaid = function() {
  return this.status === 'unpaid';
};

subscriptionSchema.methods.isTrialing = function() {
  return this.status === 'trialing';
};

subscriptionSchema.methods.willExpireSoon = function() {
  const now = new Date();
  const daysUntilExpiration = Math.ceil(
    (this.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiration <= 7;
};

subscriptionSchema.methods.getDaysRemaining = function() {
  const now = new Date();
  const end = this.currentPeriodEnd;
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

subscriptionSchema.methods.hasFeature = function(feature) {
  return this.features[feature] === true;
};

subscriptionSchema.methods.getResourceLimit = function(resource) {
  return this.features[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
};

// Static methods
subscriptionSchema.statics.findActiveSubscriptions = function() {
  return this.find({
    status: { $in: ['active', 'trialing'] }
  });
};

subscriptionSchema.statics.findExpiringSubscriptions = function() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return this.find({
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $lte: sevenDaysFromNow }
  });
};

subscriptionSchema.statics.findPastDueSubscriptions = function() {
  return this.find({ status: 'past_due' });
};

subscriptionSchema.statics.getPlanFeatures = function(plan) {
  const features = {
    basic: {
      maxElections: 5,
      maxVoters: 100,
      maxCandidates: 10,
      customBranding: false,
      advancedAnalytics: false,
      apiAccess: false,
      prioritySupport: false
    },
    professional: {
      maxElections: 20,
      maxVoters: 1000,
      maxCandidates: 50,
      customBranding: true,
      advancedAnalytics: true,
      apiAccess: false,
      prioritySupport: false
    },
    enterprise: {
      maxElections: -1, // Unlimited
      maxVoters: -1, // Unlimited
      maxCandidates: -1, // Unlimited
      customBranding: true,
      advancedAnalytics: true,
      apiAccess: true,
      prioritySupport: true
    }
  };
  return features[plan];
};

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'canceled') {
    this.canceledAt = new Date();
  }
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 