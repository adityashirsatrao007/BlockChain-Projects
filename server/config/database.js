const mongoose = require('mongoose');
const { logger } = require('../middleware/loggingMiddleware');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Close server & exit process
      process.exit(1);
    });

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Configure mongoose options
mongoose.set('debug', process.env.NODE_ENV === 'development');
mongoose.set('strictQuery', true);

// Configure mongoose schema options
mongoose.Schema.Types.String.set('trim', true);
mongoose.Schema.Types.String.set('minlength', 1);
mongoose.Schema.Types.String.set('maxlength', 1000);

// Configure mongoose query options
mongoose.Query.prototype.setOptions = function () {
  this.setOptions({
    lean: true,
    maxTimeMS: 30000,
  });
  return this;
};

module.exports = connectDB; 