const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidates: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    imageUrl: String,
    party: String,
    publicKey: {
      type: String,
      required: true
    }
  }],
  settings: {
    requireAuthentication: {
      type: Boolean,
      default: true
    },
    allowVoterRegistration: {
      type: Boolean,
      default: true
    },
    showResultsBeforeEnd: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: true
    }
  },
  results: {
    totalVotes: {
      type: Number,
      default: 0
    },
    voterTurnout: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  blockchain: {
    contractAddress: String,
    network: String,
    lastBlockMined: Number
  }
}, {
  timestamps: true
});

// Add index for efficient querying
electionSchema.index({ status: 1, startDate: 1, endDate: 1 });

// Virtual for checking if election is active
electionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Method to check if election can be started
electionSchema.methods.canStart = function() {
  return this.status === 'draft' && this.candidates.length >= 2;
};

// Method to check if election can be ended
electionSchema.methods.canEnd = function() {
  return this.status === 'active' && new Date() >= this.endDate;
};

module.exports = mongoose.model('Election', electionSchema); 