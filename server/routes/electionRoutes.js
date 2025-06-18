const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote'); // Will create this model next
const User = require('../models/User');
const Blockchain = require('../blockchain/Blockchain');
const { protect, admin } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Initialize blockchain instance (this should be a singleton or managed globally)
// For simplicity, we'll instantiate it here for demonstration, but in a real app,
// it should be initialized once and passed around or imported as a singleton.
const blockchain = new Blockchain();

// Import controllers
const {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  getElectionResults,
  castVote,
  getElectionAnalytics,
} = require('../controllers/electionController');

// Routes
router.route('/')
  .post(protect, admin, createElection)
  .get(protect, getElections);

router.route('/:id')
  .get(protect, getElectionById)
  .put(protect, admin, updateElection)
  .delete(protect, admin, deleteElection);

router.route('/:id/results')
  .get(protect, getElectionResults);

router.route('/:id/vote')
  .post(protect, castVote);

router.route('/:id/analytics')
  .get(protect, admin, getElectionAnalytics);

// @desc    Add a candidate to an election
// @route   POST /api/elections/:electionId/candidates
// @access  Private/Admin
router.post('/:electionId/candidates', protect, admin, async (req, res) => {
  const { name, description } = req.body;

  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Generate a unique public key for the candidate
    const publicKey = crypto.createHash('sha256').update(name + Date.now().toString()).digest('hex');

    const candidate = new Candidate({
      name,
      description,
      publicKey,
      election: election._id,
    });

    const createdCandidate = await candidate.save();

    // Add candidate reference to election (optional, if you want to embed)
    election.candidates.push(createdCandidate._id);
    await election.save();

    res.status(201).json(createdCandidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Get election results
// @route   GET /api/elections/:electionId/results
// @access  Public
router.get('/:electionId/results', async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const candidates = await Candidate.find({ election: election._id });
    const results = [];

    for (const candidate of candidates) {
      const voteCount = blockchain.getVoteCount(candidate.publicKey);
      results.push({
        candidateId: candidate._id,
        name: candidate.name,
        votes: voteCount,
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 