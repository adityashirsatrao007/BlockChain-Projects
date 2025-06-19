const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  blockchain: {
    transactionHash: {
      type: String,
      required: true,
      unique: true
    },
    blockNumber: Number,
    blockHash: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    location: {
      country: String,
      city: String
    }
  }
}, {
  timestamps: true
});

// Add compound index for efficient querying
voteSchema.index({ election: 1, voter: 1 }, { unique: true });
voteSchema.index({ 'blockchain.transactionHash': 1 });

// Method to check if vote is confirmed
voteSchema.methods.isConfirmed = function() {
  return this.blockchain.status === 'confirmed';
};

// Method to check if vote is pending
voteSchema.methods.isPending = function() {
  return this.blockchain.status === 'pending';
};

// Method to check if vote is failed
voteSchema.methods.isFailed = function() {
  return this.blockchain.status === 'failed';
};

module.exports = mongoose.model('Vote', voteSchema); 