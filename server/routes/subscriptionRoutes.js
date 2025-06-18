const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { checkSubscription, checkFeatureAccess } = require('../middleware/subscriptionMiddleware');
const auth = require('../middleware/auth');
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
const {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
  getSubscriptionUsage,
  getBillingHistory,
} = require('../controllers/subscriptionController');

// Routes
router.route('/')
  .post(protect, createSubscription)
  .get(protect, getSubscriptions);

router.route('/:id')
  .get(protect, getSubscriptionById)
  .put(protect, updateSubscription)
  .delete(protect, cancelSubscription);

router.route('/:id/usage')
  .get(protect, getSubscriptionUsage);

router.route('/:id/billing')
  .get(protect, getBillingHistory);

// Create a new subscription
router.post('/create', auth, async (req, res) => {
  try {
    const { plan, paymentMethodId } = req.body;
    const result = await subscriptionService.createSubscription(req.user.id, plan, paymentMethodId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.user.id);
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update subscription plan
router.post('/update', auth, async (req, res) => {
  try {
    const { newPlan } = req.body;
    const subscription = await subscriptionService.updateSubscription(req.user.id, newPlan);
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current subscription
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    res.json(subscription);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = {
      basic: {
        name: 'Basic',
        price: 9.99,
        features: Subscription.getPlanFeatures('basic'),
        description: 'Perfect for small organizations',
      },
      professional: {
        name: 'Professional',
        price: 29.99,
        features: Subscription.getPlanFeatures('professional'),
        description: 'Ideal for growing businesses',
      },
      enterprise: {
        name: 'Enterprise',
        price: 99.99,
        features: Subscription.getPlanFeatures('enterprise'),
        description: 'For large organizations with advanced needs',
      },
    };
    res.json(plans);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Handle Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    await subscriptionService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription usage
router.get('/usage', auth, checkSubscription, async (req, res) => {
  try {
    const subscription = req.subscription;
    const usage = {
      elections: await Election.countDocuments({ createdBy: req.user.id }),
      voters: await Voter.countDocuments({ userId: req.user.id }),
      candidates: await Candidate.countDocuments({ userId: req.user.id }),
      limits: {
        elections: subscription.features.maxElections,
        voters: subscription.features.maxVoters,
        candidates: subscription.features.maxCandidates,
      },
    };
    res.json(usage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription history
router.get('/history', auth, async (req, res) => {
  try {
    const history = await Subscription.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(history);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription invoices
router.get('/invoices', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      return res.json([]);
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    res.json(invoices.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subscription payment methods
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      return res.json([]);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    res.json(paymentMethods.data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add new payment method
router.post('/payment-methods', auth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    } else {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove payment method
router.delete('/payment-methods/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.stripeCustomerId) {
      return res.status(404).json({ message: 'No payment methods found' });
    }

    await stripe.paymentMethods.detach(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 