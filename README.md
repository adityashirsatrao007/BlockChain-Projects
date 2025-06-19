# Blockchain Voting System

A secure and transparent blockchain-based voting system that leverages Ethereum smart contracts for election management and vote verification.

## Overview

This project implements a complete blockchain voting system with the following key features:

- Secure and transparent voting using Ethereum smart contracts
- Real-time election results and analytics
- User authentication and authorization
- Election management and monitoring
- Blockchain explorer integration
- Responsive web interface
- WebSocket support for real-time updates

## Architecture

The system consists of three main components:

1. **Smart Contracts** (`server/contracts/`)
   - Voting contract for election management
   - Secure vote casting and verification
   - Event emission for real-time updates

2. **Backend Server** (`server/`)
   - RESTful API for election management
   - WebSocket server for real-time updates
   - Blockchain integration
   - User authentication
   - Database management

3. **Frontend Application** (`client/`)
   - Modern, responsive UI
   - Real-time updates
   - Interactive visualizations
   - Blockchain wallet integration

## Technology Stack

### Smart Contracts
- Solidity 0.8.19
- Hardhat
- OpenZeppelin
- Ethers.js

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO
- Web3.js
- JWT Authentication

### Frontend
- React.js
- Tailwind CSS
- Framer Motion
- Chart.js
- Web3.js
- Socket.IO Client

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- MetaMask or similar Web3 wallet
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockchain-voting-system
```

2. Install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both `server/` and `client/` directories
   - Update the variables with your configuration

4. Start the development servers:

```bash
# Start backend server
cd server
npm run dev

# Start frontend server
cd ../client
npm start
```

## Development

### Smart Contract Development

1. Compile contracts:
```bash
cd server
npm run compile
```

2. Run tests:
```bash
npm run test:contract
```

3. Deploy to local network:
```bash
npm run setup
```

### Backend Development

1. Start development server:
```bash
cd server
npm run dev
```

2. Run tests:
```bash
npm test
```

### Frontend Development

1. Start development server:
```bash
cd client
npm start
```

2. Run tests:
```bash
npm test
```

## Deployment

### Smart Contract Deployment

1. Update network configuration in `hardhat.config.js`
2. Deploy to target network:
```bash
npm run deploy:network
```

### Backend Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

### Frontend Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `build` directory to your hosting service

## Security

- Smart contract security best practices
- Input validation and sanitization
- Rate limiting
- CORS configuration
- JWT authentication
- Password hashing
- Secure WebSocket connections

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@blockchainvoting.com or create an issue in the repository. 