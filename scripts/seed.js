const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../server/models/User.model');
const Project = require('../server/models/Project.model');
const ContributionBlock = require('../server/models/ContributionBlock.model');
const GovernanceAction = require('../server/models/GovernanceAction.model');
const Review = require('../server/models/Review.model');
const Upvote = require('../server/models/Upvote.model');
const ReputationLog = require('../server/models/ReputationLog.model');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ideaxchange';
const SIGNING_KEY = process.env.PLATFORM_SIGNING_KEY || 'seed-signing-key-for-development-purposes';

const computeHash = (prevHash, userId, delta, timestamp) => {
  return crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(userId.toString() + JSON.stringify(delta) + timestamp.toString() + prevHash)
    .digest('hex');
};

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      ContributionBlock.deleteMany({}),
      GovernanceAction.deleteMany({}),
      Review.deleteMany({}),
      Upvote.deleteMany({}),
      ReputationLog.deleteMany({})
    ]);

    console.log('Seeding Users...');
    const users = await User.insertMany([
      { name: 'Alice Smith', institutionalEmail: 'alice@university.edu', password: 'Password@123', role: 'student', department: 'CS', batchYear: 2024 },
      { name: 'Bob Jones', institutionalEmail: 'bob@university.edu', password: 'Password@123', role: 'student', department: 'EE', batchYear: 2025 },
      { name: 'Charlie Davis', institutionalEmail: 'charlie@university.edu', password: 'Password@123', role: 'student', department: 'CS', batchYear: 2024 },
      { name: 'Dr. Sarah Wilson', institutionalEmail: 'sarah@university.edu', password: 'Password@123', role: 'faculty' },
      { name: 'Innovation Admin', institutionalEmail: 'admin@university.edu', password: 'Password@123', role: 'admin' },
      { name: 'Venture Capital X', institutionalEmail: 'contact@vc-x.com', password: 'Password@123', role: 'stakeholder' }
    ]);

    const [s1, s2, s3, faculty, admin, stakeholder] = users;

    console.log('Seeding Projects...');
    const projectA = await Project.create({
      title: 'Neural Vision Core',
      problemStatement: 'Low-cost edge inference for blind navigation.',
      techStack: ['Python', 'TensorFlow', 'C++'],
      ownerId: s1._id,
      state: 'VALIDATING'
    });

    const projectB = await Project.create({
      title: 'Decentralized Grid',
      problemStatement: 'P2P energy sharing protocol.',
      techStack: ['Solidity', 'Go', 'React'],
      ownerId: s2._id,
      state: 'CERTIFIED',
      impactScore: 8.2,
      certifiedAt: new Date()
    });

    console.log('Seeding Contribution Blocks...');
    const types = ['ALGORITHM', 'RESEARCH', 'UIUX', 'DOCUMENTATION'];
    
    const seedBlocks = async (project, owner) => {
      let prevHash = 'GENESIS_00000000000000000000000000000000';
      for (let i = 0; i < 12; i++) {
        const timestamp = new Date(Date.now() - (12 - i) * 3600000);
        const delta = { content: `Contribution update ${i} for ${project.title}` };
        const currentHash = computeHash(prevHash, owner._id, delta, timestamp);
        
        await ContributionBlock.create({
          projectId: project._id,
          blockIndex: i,
          contributorId: owner._id,
          deltaData: delta,
          contributionType: types[i % 4],
          previousHash: prevHash,
          currentHash: currentHash,
          timestamp: timestamp,
          isGenesis: i === 0
        });
        prevHash = currentHash;
        
        // Add some random votes/reviews for each block
        if (i % 3 === 0) {
          await Review.create({
            contributionBlockId: (await ContributionBlock.findOne({ projectId: project._id, blockIndex: i }))._id,
            reviewerId: faculty._id,
            reviewerRole: 'expert',
            score: 8 + (i % 3),
            isSubstantive: true
          });
        }
        
        await Upvote.create({
          contributionBlockId: (await ContributionBlock.findOne({ projectId: project._id, blockIndex: i }))._id,
          voterId: s3._id,
          voterDepartment: s3.department,
          voterBatchYear: s3.batchYear
        }).catch(() => {}); // Ignore duplicates
      }
    };

    await seedBlocks(projectA, s1);
    await seedBlocks(projectB, s2);

    console.log('Seeding Governance Actions...');
    await GovernanceAction.create({
      projectId: projectA._id,
      actionType: 'CERTIFY',
      proposedBy: faculty._id,
      status: 'PENDING'
    });

    await GovernanceAction.create({
      projectId: projectB._id,
      actionType: 'ADD_STAKEHOLDER',
      proposedBy: stakeholder._id,
      status: 'APPROVED',
      executedAt: new Date()
    });

    console.log('Seeding Reputation Logs...');
    await ReputationLog.create({ userId: s1._id, projectId: projectA._id, event: 'CONTRIBUTION_ADOPTED', pointsAwarded: 50 });
    await ReputationLog.create({ userId: s2._id, projectId: projectB._id, event: 'CONTRIBUTION_ADOPTED', pointsAwarded: 100 });
    await ReputationLog.create({ userId: faculty._id, event: 'EXPERT_ALIGN', pointsAwarded: 20 });
    await ReputationLog.create({ userId: s3._id, event: 'PEER_REVIEW_SUBSTANTIVE', pointsAwarded: 10 });

    console.table([
      { Entity: 'Users', Count: await User.countDocuments() },
      { Entity: 'Projects', Count: await Project.countDocuments() },
      { Entity: 'ContributionBlocks', Count: await ContributionBlock.countDocuments() },
      { Entity: 'GovernanceActions', Count: await GovernanceAction.countDocuments() },
      { Entity: 'Reviews', Count: await Review.countDocuments() },
      { Entity: 'Upvotes', Count: await Upvote.countDocuments() },
      { Entity: 'ReputationLogs', Count: await ReputationLog.countDocuments() }
    ]);

    await mongoose.connection.close();
    console.log('Seeding migration complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
