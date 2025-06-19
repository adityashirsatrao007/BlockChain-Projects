require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const configureServer = require('./config/server');
const { logger } = require('./middleware/loggingMiddleware');

// Create Express app
const app = express();

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Configure server
const { httpServer, io } = configureServer(app);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
}); 