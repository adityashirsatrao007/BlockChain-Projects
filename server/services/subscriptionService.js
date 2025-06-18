const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { auditLogService } = require('./auditLogService');
const { sendEmail } = require('./emailService');

class SubscriptionService {
  async createSubscription(userId, plan, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create or get Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: this.getPlanPriceId(plan) }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Create subscription in database
      const features = Subscription.getPlanFeatures(plan);
      const newSubscription = new Subscription({
        userId,
        plan,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        features,
        status: subscription.status,
      });

      await newSubscription.save();

      // Log subscription creation
      await auditLogService.addLog('subscription_created', {
        userId,
        plan,
        subscriptionId: subscription.id,
      });

      return {
        subscription: newSubscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update subscription in database
      subscription.cancelAtPeriodEnd = true;
      subscription.canceledAt = new Date();
      await subscription.save();

      // Log subscription cancellation
      await auditLogService.addLog('subscription_canceled', {
        userId,
        subscriptionId: subscription.stripeSubscriptionId,
      });

      // Send cancellation email
      const user = await User.findById(userId);
      await sendEmail({
        to: user.email,
        subject: 'Subscription Cancellation Confirmation',
        template: 'subscription-canceled',
        context: {
          name: user.name,
          plan: subscription.plan,
          endDate: subscription.currentPeriodEnd,
        },
      });

      return subscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async updateSubscription(userId, newPlan) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update subscription in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: subscription.stripeSubscriptionId,
          price: this.getPlanPriceId(newPlan),
        }],
      });

      // Update subscription in database
      const features = Subscription.getPlanFeatures(newPlan);
      subscription.plan = newPlan;
      subscription.features = features;
      await subscription.save();

      // Log subscription update
      await auditLogService.addLog('subscription_updated', {
        userId,
        oldPlan: subscription.plan,
        newPlan,
        subscriptionId: subscription.stripeSubscriptionId,
      });

      // Send update email
      const user = await User.findById(userId);
      await sendEmail({
        to: user.email,
        subject: 'Subscription Plan Updated',
        template: 'subscription-updated',
        context: {
          name: user.name,
          oldPlan: subscription.plan,
          newPlan,
        },
      });

      return subscription;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  async getSubscriptionDetails(userId) {
    try {
      const subscription = await Subscription.findOne({ userId })
        .populate('userId', 'email name');

      if (!subscription) {
        return null;
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      return {
        ...subscription.toObject(),
        stripeSubscription
      };
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  async getBillingHistory(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 12
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        pdf: invoice.invoice_pdf
      }));
    } catch (error) {
      console.error('Error getting billing history:', error);
      throw error;
    }
  }

  async generateInvoice(userId, invoiceId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.stripeCustomerId) {
        throw new Error('User not found or no Stripe customer ID');
      }

      const invoice = await stripe.invoices.retrieve(invoiceId);
      return invoice.invoice_pdf;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  }

  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChange(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleFailedPayment(event.data.object);
          break;
      }
    } catch (error) {
      throw new Error(`Webhook handling failed: ${error.message}`);
    }
  }

  async handleSubscriptionChange(subscription) {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!dbSubscription) {
      throw new Error('Subscription not found');
    }

    dbSubscription.status = subscription.status;
    dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    if (subscription.cancel_at_period_end) {
      dbSubscription.cancelAtPeriodEnd = true;
      dbSubscription.canceledAt = new Date();
    }

    await dbSubscription.save();
  }

  async handleSuccessfulPayment(invoice) {
    const subscription = await Subscription.findOne({
      stripeCustomerId: invoice.customer,
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription status
    subscription.status = 'active';
    await subscription.save();

    // Send payment confirmation email
    const user = await User.findById(subscription.userId);
    await sendEmail({
      to: user.email,
      subject: 'Payment Successful',
      template: 'payment-successful',
      context: {
        name: user.name,
        amount: invoice.amount_paid / 100,
        date: new Date(),
      },
    });
  }

  async handleFailedPayment(invoice) {
    const subscription = await Subscription.findOne({
      stripeCustomerId: invoice.customer,
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Update subscription status
    subscription.status = 'past_due';
    await subscription.save();

    // Send payment failure email
    const user = await User.findById(subscription.userId);
    await sendEmail({
      to: user.email,
      subject: 'Payment Failed',
      template: 'payment-failed',
      context: {
        name: user.name,
        amount: invoice.amount_due / 100,
        date: new Date(),
      },
    });
  }

  getPlanPriceId(plan) {
    const priceIds = {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };
    return priceIds[plan];
  }

  checkFeatureAccess(subscription, feature) {
    return subscription.features[feature] === true;
  }

  checkLimits(subscription, resource, currentCount) {
    const limit = subscription.getResourceLimit(resource);
    return limit === -1 || currentCount < limit;
  }
}

module.exports = new SubscriptionService(); 