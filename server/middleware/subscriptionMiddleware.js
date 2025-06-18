const User = require('../models/User');
const Subscription = require('../models/Subscription');

const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscription = await Subscription.findOne({ userId: user._id });
    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        message: 'Active subscription required',
        required: true
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription || !subscription.isActive()) {
        return res.status(403).json({
          message: 'Active subscription required',
          required: true
        });
      }

      const hasAccess = subscriptionService.checkFeatureAccess(subscription, feature);
      if (!hasAccess) {
        return res.status(403).json({
          message: 'This feature requires a higher subscription tier',
          required: true
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

const checkResourceLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription || !subscription.isActive()) {
        return res.status(403).json({
          message: 'Active subscription required',
          required: true
        });
      }

      // Get current resource count
      let currentCount;
      switch (resource) {
        case 'elections':
          currentCount = await Election.countDocuments({ createdBy: user._id });
          break;
        case 'voters':
          currentCount = await Voter.countDocuments({ userId: user._id });
          break;
        case 'candidates':
          currentCount = await Candidate.countDocuments({ userId: user._id });
          break;
        default:
          return res.status(400).json({ message: 'Invalid resource type' });
      }

      const withinLimit = subscriptionService.checkLimits(
        subscription,
        resource,
        currentCount
      );

      if (!withinLimit) {
        return res.status(403).json({
          message: `You have reached the maximum number of ${resource} for your subscription tier`,
          required: true
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = {
  checkSubscription,
  checkFeatureAccess,
  checkResourceLimit
}; 