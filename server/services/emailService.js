const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    const template = await fs.readFile(templatePath, 'utf-8');
    return handlebars.compile(template);
  }

  async sendEmail({ to, subject, template, context }) {
    try {
      const compiledTemplate = await this.loadTemplate(template);
      const html = compiledTemplate(context);

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendSubscriptionCreatedEmail(user, subscription) {
    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Your New Subscription',
      template: 'subscription-created',
      context: {
        name: user.name,
        plan: subscription.plan,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        features: subscription.features,
      },
    });
  }

  async sendSubscriptionCanceledEmail(user, subscription) {
    await this.sendEmail({
      to: user.email,
      subject: 'Subscription Cancellation Confirmation',
      template: 'subscription-canceled',
      context: {
        name: user.name,
        plan: subscription.plan,
        endDate: subscription.currentPeriodEnd,
      },
    });
  }

  async sendSubscriptionUpdatedEmail(user, subscription, oldPlan) {
    await this.sendEmail({
      to: user.email,
      subject: 'Subscription Plan Updated',
      template: 'subscription-updated',
      context: {
        name: user.name,
        oldPlan,
        newPlan: subscription.plan,
        features: subscription.features,
      },
    });
  }

  async sendPaymentSuccessfulEmail(user, invoice) {
    await this.sendEmail({
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

  async sendPaymentFailedEmail(user, invoice) {
    await this.sendEmail({
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

  async sendTrialEndingEmail(user, subscription) {
    await this.sendEmail({
      to: user.email,
      subject: 'Your Trial is Ending Soon',
      template: 'trial-ending',
      context: {
        name: user.name,
        plan: subscription.plan,
        endDate: subscription.trialEnd,
      },
    });
  }

  async sendSubscriptionExpiringEmail(user, subscription) {
    await this.sendEmail({
      to: user.email,
      subject: 'Your Subscription is Expiring Soon',
      template: 'subscription-expiring',
      context: {
        name: user.name,
        plan: subscription.plan,
        endDate: subscription.currentPeriodEnd,
      },
    });
  }

  async sendInvoiceEmail(user, invoice) {
    await this.sendEmail({
      to: user.email,
      subject: 'Your Invoice',
      template: 'invoice',
      context: {
        name: user.name,
        invoiceNumber: invoice.number,
        amount: invoice.amount_paid / 100,
        date: new Date(invoice.created * 1000),
        items: invoice.lines.data.map(item => ({
          description: item.description,
          amount: item.amount / 100,
        })),
      },
    });
  }
}

module.exports = new EmailService(); 