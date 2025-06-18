const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Import controllers
const {
  getBlockchain,
  getBlock,
  getTransaction,
  getMiningStatus,
  startMining,
  stopMining,
  getNetworkStats,
} = require('../controllers/blockchainController');

// Routes
router.route('/')
  .get(protect, getBlockchain);

router.route('/block/:hash')
  .get(protect, getBlock);

router.route('/transaction/:hash')
  .get(protect, getTransaction);

router.route('/mining')
  .get(protect, admin, getMiningStatus)
  .post(protect, admin, startMining)
  .delete(protect, admin, stopMining);

router.route('/network')
  .get(protect, getNetworkStats);

module.exports = router; 