const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const { AppError } = require('./errorHandler');

const securityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
      ],
    })
  );

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(
    hpp({
      whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price',
      ],
    })
  );

  // Trust proxy
  app.enable('trust proxy');

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
  });

  // Request size limit
  app.use((req, res, next) => {
    if (req.headers['content-length'] > 1000000) {
      return next(
        new AppError('Request entity too large', 413)
      );
    }
    next();
  });

  // Prevent clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Prevent MIME type sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Prevent XSS attacks
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Prevent IE from executing downloads in your site's context
  app.use((req, res, next) => {
    res.setHeader('X-Download-Options', 'noopen');
    next();
  });

  // Prevent browsers from performing MIME sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Disable caching for sensitive routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/v1/auth')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
  });

  // Prevent DNS prefetching
  app.use((req, res, next) => {
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
  });

  // Prevent IE from executing downloads in your site's context
  app.use((req, res, next) => {
    res.setHeader('X-Download-Options', 'noopen');
    next();
  });

  // Prevent browsers from performing MIME sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Prevent clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Prevent XSS attacks
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};

module.exports = securityMiddleware; 