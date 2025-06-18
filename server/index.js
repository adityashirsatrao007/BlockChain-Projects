const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const electionRoutes = require('./routes/electionRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join election room
  socket.on('joinElection', (electionId) => {
    socket.join(`election_${electionId}`);
    console.log(`User ${socket.id} joined election ${electionId}`);
  });

  // Leave election room
  socket.on('leaveElection', (electionId) => {
    socket.leave(`election_${electionId}`);
    console.log(`User ${socket.id} left election ${electionId}`);
  });

  // Handle votes
  socket.on('vote', async (data) => {
    try {
      // Broadcast vote to all users in the election room
      io.to(`election_${data.electionId}`).emit('voteUpdate', {
        electionId: data.electionId,
        candidateId: data.candidateId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    io.to(`election_${data.electionId}`).emit('chatMessage', {
      electionId: data.electionId,
      message: data.message,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain_voting';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('MongoDB connection error:', err);
}); 