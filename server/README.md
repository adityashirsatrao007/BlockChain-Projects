# Blockchain Voting System - Backend

This is the backend server for a blockchain-based voting system. It provides a RESTful API for managing elections, votes, and user authentication, with blockchain integration for secure and transparent voting.

## Features

- User authentication and authorization
- Election management (create, update, delete)
- Real-time vote tracking
- Blockchain integration for secure voting
- WebSocket support for real-time updates
- Analytics and reporting
- Subscription management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Ethereum node (local or remote)
- MetaMask or similar Web3 wallet

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/blockchain_voting
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000
ETHEREUM_NETWORK=localhost
INFURA_PROJECT_ID=your_infura_project_id
CONTRACT_ADDRESS=your_contract_address
```

4. Compile and deploy the smart contract:
```bash
npm run compile
npm run setup
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
npm run test:contract
```

## API Endpoints

### Authentication
- POST /api/users/register - Register a new user
- POST /api/users/login - Login user
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile

### Elections
- POST /api/elections - Create a new election
- GET /api/elections - Get all elections
- GET /api/elections/:id - Get election by ID
- PUT /api/elections/:id - Update election
- DELETE /api/elections/:id - Delete election
- GET /api/elections/:id/results - Get election results
- POST /api/elections/:id/vote - Cast a vote
- GET /api/elections/:id/analytics - Get election analytics

### Blockchain
- GET /api/blockchain - Get blockchain status
- GET /api/blockchain/block/:hash - Get block details
- GET /api/blockchain/transaction/:hash - Get transaction details
- GET /api/blockchain/mining - Get mining status
- POST /api/blockchain/mining - Start mining
- DELETE /api/blockchain/mining - Stop mining
- GET /api/blockchain/network - Get network stats

### Subscriptions
- POST /api/subscriptions - Create a new subscription
- GET /api/subscriptions - Get all subscriptions
- GET /api/subscriptions/:id - Get subscription by ID
- PUT /api/subscriptions/:id - Update subscription
- DELETE /api/subscriptions/:id - Cancel subscription
- GET /api/subscriptions/:id/usage - Get subscription usage
- GET /api/subscriptions/:id/billing - Get billing history

## WebSocket Events

### Election Events
- election:created - New election created
- election:updated - Election updated
- election:deleted - Election deleted
- vote:cast - New vote cast
- results:updated - Election results updated

### Blockchain Events
- block:new - New block mined
- transaction:new - New transaction
- transaction:confirmed - Transaction confirmed

### User Events
- user:registered - New user registered
- user:loggedIn - User logged in
- user:loggedOut - User logged out

## Smart Contract

The voting system uses a Solidity smart contract for secure and transparent voting. The contract includes the following features:

- Election creation and management
- Candidate management
- Secure voting mechanism
- Vote counting and verification
- Event emission for real-time updates

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 