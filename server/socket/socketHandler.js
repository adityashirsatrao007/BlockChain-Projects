const { logger } = require('../middleware/loggingMiddleware');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info('User connected:', socket.id);

    // Join election room
    socket.on('joinElection', (electionId) => {
      socket.join(`election_${electionId}`);
      logger.info(`User ${socket.id} joined election ${electionId}`);
    });

    // Leave election room
    socket.on('leaveElection', (electionId) => {
      socket.leave(`election_${electionId}`);
      logger.info(`User ${socket.id} left election ${electionId}`);
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
        logger.info(`Vote cast in election ${data.electionId} for candidate ${data.candidateId}`);
      } catch (error) {
        logger.error('Error handling vote:', error);
      }
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
      io.to(`election_${data.electionId}`).emit('chatMessage', {
        electionId: data.electionId,
        message: data.message,
        timestamp: new Date()
      });
      logger.info(`Chat message in election ${data.electionId}`);
    });

    // Handle blockchain updates
    socket.on('blockchainUpdate', (data) => {
      io.emit('blockchainUpdate', {
        type: data.type,
        data: data.data,
        timestamp: new Date()
      });
      logger.info(`Blockchain update: ${data.type}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler; 