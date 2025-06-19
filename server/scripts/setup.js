const { spawn } = require('child_process');
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  // Start local Ethereum network
  console.log('Starting local Ethereum network...');
  const node = spawn('npx', ['hardhat', 'node'], {
    stdio: 'inherit',
    shell: true
  });

  // Wait for network to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy contract
  console.log('Deploying Voting contract...');
  const Voting = await ethers.getContractFactory('Voting');
  const voting = await Voting.deploy();
  await voting.deployed();

  console.log('Voting contract deployed to:', voting.address);

  // Save contract address to .env file
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = `CONTRACT_ADDRESS=${voting.address}\n`;
  fs.appendFileSync(envPath, envContent);

  console.log('Contract address saved to .env file');

  // Keep the script running
  process.on('SIGINT', () => {
    console.log('Stopping local Ethereum network...');
    node.kill();
    process.exit();
  });
}

main()
  .then(() => {
    console.log('Setup completed successfully');
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 