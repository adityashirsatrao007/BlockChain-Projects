const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Specific limiters for different routes
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth-limit:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.',
  },
});

const voteLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'vote-limit:',
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // 1 vote per day per IP
  message: {
    status: 'error',
    message: 'You have already voted in this election.',
  },
});

const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'api-limit:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    status: 'error',
    message: 'Too many API requests, please try again later.',
  },
});

module.exports = {
  limiter,
  authLimiter,
  voteLimiter,
  apiLimiter,
}; 