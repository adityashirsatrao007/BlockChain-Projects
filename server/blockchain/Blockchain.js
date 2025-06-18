const crypto = require('crypto');

class Block {
  constructor(index, transactions, timestamp, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256').update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor(difficulty = 4) {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = difficulty;
    this.pendingTransactions = [];
    this.miningReward = 10;
  }

  createGenesisBlock() {
    return new Block(0, [], Date.now(), '0'.repeat(64));
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(minerAddress) {
    const block = new Block(
      this.chain.length,
      this.pendingTransactions,
      Date.now(),
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [
      { from: 'network', to: minerAddress, amount: this.miningReward, timestamp: Date.now() }
    ];
  }

  addTransaction(sender, recipient, amount) {
    this.pendingTransactions.push({
      from: sender,
      to: recipient,
      amount: amount,
      timestamp: Date.now(),
    });
  }

  getBalance(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= transaction.amount;
        }
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  getVoteCount(candidateAddress) {
    let voteCount = 0;
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.to === candidateAddress && transaction.amount === 1) {
          voteCount++;
        }
      }
    }
    return voteCount;
  }
}

module.exports = Blockchain; 