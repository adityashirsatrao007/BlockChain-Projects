const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vote = require('../models/Vote'); // Import Vote model
const { protect } = require('../middleware/authMiddleware');

// Import controllers
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// @desc    Get votes by a specific user
// @route   GET /api/users/:userId/votes
// @access  Private
router.get('/:userId/votes', protect, async (req, res) => {
  // Ensure the logged-in user is requesting their own votes or is an admin
  if (req.user._id.toString() !== req.params.userId && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Not authorized to view these votes' });
  }

  try {
    const userVotes = await Vote.find({ voter: req.params.userId })
      .populate('election') // Populate election details
      .populate('candidate'); // Populate candidate details

    res.json(userVotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 