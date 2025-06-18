const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { logger } = require('../middleware/loggingMiddleware');
const securityMiddleware = require('../middleware/securityMiddleware');
const {
  loggingMiddleware,
  errorLoggingMiddleware,
  performanceLoggingMiddleware,
  securityLoggingMiddleware,
} = require('../middleware/loggingMiddleware');
const { limiter } = require('../middleware/rateLimiter');
const { errorHandler } = require('../middleware/errorHandler');

const configureServer = (app) => {
  // Security middleware
  securityMiddleware(app);

  // Basic middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  app.use(compression());

  // Logging middleware
  app.use(morgan('dev'));
  app.use(loggingMiddleware);
  app.use(performanceLoggingMiddleware);
  app.use(securityLoggingMiddleware);

  // Rate limiting
  app.use('/api', limiter);

  // Static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Create HTTP server
  const httpServer = createServer(app);

  // Configure Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket.IO middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // Verify token and attach user to socket
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    logger.info('New client connected:', socket.id);

    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  // Error handling
  app.use(errorLoggingMiddleware);
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  return { app, httpServer, io };
};

module.exports = configureServer; 