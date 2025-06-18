const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const { Blockchain } = require('./blockchain/Blockchain'); // Assuming Blockchain.js exports the class

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blockchain_voting';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected for seeding');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const seedDatabase = async () => {
  try {
    await User.deleteMany();
    await Election.deleteMany();
    await Candidate.deleteMany();

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
      publicKey: 'admin_' + Date.now().toString(),
    });
    console.log('Admin user created');

    const user1 = await User.create({
      username: 'user1',
      email: 'user1@example.com',
      password: 'password123',
      publicKey: 'user1_' + Date.now().toString(),
    });
    console.log('User1 created');

    const now = new Date();
    const election1 = await Election.create({
      title: 'Student Body President 2024',
      description: 'Vote for the next student body president.',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
      endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Ends in 5 days
      status: 'active',
      createdBy: adminUser._id,
    });
    console.log('Election 1 created');

    const candidate1_1 = await Candidate.create({
      name: 'Alice Smith',
      description: 'Experienced leader.',
      publicKey: 'candidate_alice_smith',
      election: election1._id,
    });
    const candidate1_2 = await Candidate.create({
      name: 'Bob Johnson',
      description: 'Fresh ideas.',
      publicKey: 'candidate_bob_johnson',
      election: election1._id,
    });
    console.log('Candidates for Election 1 created');

    const election2 = await Election.create({
      title: 'Local City Council By-Election',
      description: 'Vote for your local city representative.',
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Ends in 3 days
      status: 'active',
      createdBy: adminUser._id,
    });
    console.log('Election 2 created');

    const candidate2_1 = await Candidate.create({
      name: 'Charlie Brown',
      description: 'Community advocate.',
      publicKey: 'candidate_charlie_brown',
      election: election2._id,
    });
    console.log('Candidates for Election 2 created');


    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 