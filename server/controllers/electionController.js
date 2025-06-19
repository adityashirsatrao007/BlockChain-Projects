const Election = require('../models/Election');
const Vote = require('../models/Vote');
const { logger } = require('../middleware/loggingMiddleware');

// @desc    Create a new election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      type,
      candidates,
      settings
    } = req.body;

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      type,
      candidates,
      settings,
      createdBy: req.user._id
    });

    res.status(201).json(election);
  } catch (error) {
    logger.error('Create election error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all elections
// @route   GET /api/elections
// @access  Private
const getElections = async (req, res) => {
  try {
    const elections = await Election.find({})
      .populate('createdBy', 'username')
      .sort('-createdAt');
    res.json(elections);
  } catch (error) {
    logger.error('Get elections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get election by ID
// @route   GET /api/elections/:id
// @access  Private
const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('candidates');

    if (election) {
      res.json(election);
    } else {
      res.status(404).json({ message: 'Election not found' });
    }
  } catch (error) {
    logger.error('Get election error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update election
// @route   PUT /api/elections/:id
// @access  Private/Admin
const updateElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election can be updated
    if (election.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update completed election' });
    }

    const updatedElection = await Election.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedElection);
  } catch (error) {
    logger.error('Update election error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election can be deleted
    if (election.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete active election' });
    }

    await election.remove();
    res.json({ message: 'Election removed' });
  } catch (error) {
    logger.error('Delete election error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Private
const getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if results can be shown
    if (!election.settings.showResultsBeforeEnd && election.status === 'active') {
      return res.status(403).json({ message: 'Results not available until election ends' });
    }

    const votes = await Vote.find({ election: req.params.id });
    const results = {
      totalVotes: votes.length,
      candidates: election.candidates.map(candidate => ({
        ...candidate.toObject(),
        votes: votes.filter(vote => vote.candidate.toString() === candidate._id.toString()).length
      }))
    };

    res.json(results);
  } catch (error) {
    logger.error('Get results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cast a vote
// @route   POST /api/elections/:id/vote
// @access  Private
const castVote = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election is active
    if (election.status !== 'active') {
      return res.status(400).json({ message: 'Election is not active' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({
      election: req.params.id,
      voter: req.user._id
    });

    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Create vote
    const vote = await Vote.create({
      election: req.params.id,
      voter: req.user._id,
      candidate: req.body.candidateId,
      blockchain: {
        transactionHash: req.body.transactionHash
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Update election results
    election.results.totalVotes += 1;
    await election.save();

    res.status(201).json(vote);
  } catch (error) {
    logger.error('Cast vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get election analytics
// @route   GET /api/elections/:id/analytics
// @access  Private/Admin
const getElectionAnalytics = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const votes = await Vote.find({ election: req.params.id });
    const analytics = {
      totalVotes: votes.length,
      voterTurnout: (votes.length / election.settings.maxVoters) * 100,
      votesByTime: votes.reduce((acc, vote) => {
        const hour = new Date(vote.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {}),
      votesByDevice: votes.reduce((acc, vote) => {
        const device = vote.metadata.deviceType || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {}),
      votesByLocation: votes.reduce((acc, vote) => {
        const country = vote.metadata.location?.country || 'unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(analytics);
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createElection,
  getElections,
  getElectionById,
  updateElection,
  deleteElection,
  getElectionResults,
  castVote,
  getElectionAnalytics
}; 