const Subscription = require('../models/Subscription');
const { logger } = require('../middleware/loggingMiddleware');

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      status: { $in: ['active', 'trial'] }
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    // Set subscription features based on plan
    const features = {
      basic: {
        maxElections: 5,
        maxVoters: 1000,
        analytics: false,
        customBranding: false,
        prioritySupport: false
      },
      professional: {
        maxElections: 20,
        maxVoters: 10000,
        analytics: true,
        customBranding: true,
        prioritySupport: false
      },
      enterprise: {
        maxElections: -1, // Unlimited
        maxVoters: -1, // Unlimited
        analytics: true,
        customBranding: true,
        prioritySupport: true
      }
    };

    // Set subscription amount based on plan
    const amounts = {
      basic: 29.99,
      professional: 99.99,
      enterprise: 299.99
    };

    const subscription = await Subscription.create({
      user: req.user._id,
      plan,
      status: 'trial',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      features: features[plan],
      billing: {
        amount: amounts[plan],
        paymentMethod
      }
    });

    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .sort('-createdAt');
    res.json(subscriptions);
  } catch (error) {
    logger.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get subscription by ID
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns the subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(subscription);
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns the subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if subscription can be updated
    if (!subscription.canRenew()) {
      return res.status(400).json({ message: 'Subscription cannot be updated' });
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedSubscription);
  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns the subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.json({ message: 'Subscription cancelled' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get subscription usage
// @route   GET /api/subscriptions/:id/usage
// @access  Private
const getSubscriptionUsage = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns the subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      usage: subscription.usage,
      limits: subscription.features,
      exceeded: subscription.hasExceededLimits()
    });
  } catch (error) {
    logger.error('Get subscription usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get billing history
// @route   GET /api/subscriptions/:id/billing
// @access  Private
const getBillingHistory = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Check if user owns the subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      currentPlan: subscription.plan,
      billingAmount: subscription.billing.amount,
      billingInterval: subscription.billing.interval,
      nextBillingDate: subscription.billing.nextBillingDate,
      paymentMethod: subscription.billing.paymentMethod,
      lastPayment: {
        date: subscription.billing.lastPaymentDate,
        amount: subscription.billing.lastPaymentAmount
      }
    });
  } catch (error) {
    logger.error('Get billing history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  getBillingHistory
}; 