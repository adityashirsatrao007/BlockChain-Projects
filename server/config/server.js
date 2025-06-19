const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { logger } = require('../middleware/loggingMiddleware');

// Import routes
const userRoutes = require('../routes/userRoutes');
const electionRoutes = require('../routes/electionRoutes');
const blockchainRoutes = require('../routes/blockchainRoutes');
const subscriptionRoutes = require('../routes/subscriptionRoutes');

// Import socket handlers
const socketHandler = require('../socket/socketHandler');

const configureServer = (app) => {
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
  app.use(helmet());
  app.use(compression());

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/elections', electionRoutes);
  app.use('/api/blockchain', blockchainRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Configure Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Initialize socket handlers
  socketHandler(io);

  return { httpServer, io };
};

module.exports = configureServer; 