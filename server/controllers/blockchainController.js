const Web3 = require('web3');
const { logger } = require('../middleware/loggingMiddleware');

// Initialize Web3
const web3 = new Web3(process.env.ETHEREUM_NETWORK === 'localhost' 
  ? 'http://localhost:8545'
  : `https://${process.env.ETHEREUM_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
);

// @desc    Get blockchain status
// @route   GET /api/blockchain
// @access  Private
const getBlockchain = async (req, res) => {
  try {
    const [blockNumber, gasPrice, networkId] = await Promise.all([
      web3.eth.getBlockNumber(),
      web3.eth.getGasPrice(),
      web3.eth.net.getId()
    ]);

    res.json({
      blockNumber,
      gasPrice: web3.utils.fromWei(gasPrice, 'gwei'),
      networkId,
      network: process.env.ETHEREUM_NETWORK
    });
  } catch (error) {
    logger.error('Get blockchain status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get block details
// @route   GET /api/blockchain/block/:hash
// @access  Private
const getBlock = async (req, res) => {
  try {
    const block = await web3.eth.getBlock(req.params.hash, true);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.json({
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      transactions: block.transactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: web3.utils.fromWei(tx.value, 'ether'),
        gas: tx.gas,
        gasPrice: web3.utils.fromWei(tx.gasPrice, 'gwei')
      }))
    });
  } catch (error) {
    logger.error('Get block error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get transaction details
// @route   GET /api/blockchain/transaction/:hash
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const tx = await web3.eth.getTransaction(req.params.hash);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const receipt = await web3.eth.getTransactionReceipt(req.params.hash);
    res.json({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: web3.utils.fromWei(tx.value, 'ether'),
      gas: tx.gas,
      gasPrice: web3.utils.fromWei(tx.gasPrice, 'gwei'),
      nonce: tx.nonce,
      blockNumber: tx.blockNumber,
      blockHash: tx.blockHash,
      status: receipt.status,
      gasUsed: receipt.gasUsed
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get mining status
// @route   GET /api/blockchain/mining
// @access  Private/Admin
const getMiningStatus = async (req, res) => {
  try {
    const isMining = await web3.eth.isMining();
    const coinbase = await web3.eth.getCoinbase();
    const hashrate = await web3.eth.getHashrate();

    res.json({
      isMining,
      coinbase,
      hashrate: web3.utils.fromWei(hashrate, 'ether')
    });
  } catch (error) {
    logger.error('Get mining status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start mining
// @route   POST /api/blockchain/mining
// @access  Private/Admin
const startMining = async (req, res) => {
  try {
    await web3.eth.startMining();
    res.json({ message: 'Mining started' });
  } catch (error) {
    logger.error('Start mining error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Stop mining
// @route   DELETE /api/blockchain/mining
// @access  Private/Admin
const stopMining = async (req, res) => {
  try {
    await web3.eth.stopMining();
    res.json({ message: 'Mining stopped' });
  } catch (error) {
    logger.error('Stop mining error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get network stats
// @route   GET /api/blockchain/network
// @access  Private
const getNetworkStats = async (req, res) => {
  try {
    const [peerCount, syncing, version] = await Promise.all([
      web3.eth.net.getPeerCount(),
      web3.eth.isSyncing(),
      web3.version.node
    ]);

    res.json({
      peerCount,
      syncing,
      version,
      network: process.env.ETHEREUM_NETWORK
    });
  } catch (error) {
    logger.error('Get network stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBlockchain,
  getBlock,
  getTransaction,
  getMiningStatus,
  startMining,
  stopMining,
  getNetworkStats
}; 