const ContributionBlock = require('../models/ContributionBlock.model');
const Project = require('../models/Project.model');
const { hashBlock, verifyBlockHmac } = require('../utils/hash');
const { logSecurityEvent } = require('../utils/securityLogger');
const logger = require('../utils/logger');

/**
 * MICRO-CONTRIBUTION LEDGER SERVICE
 * Implementation of a centralized verifiable hash-chain for institutional IP attribution.
 */
class LedgerService {
  /**
   * Initializes a project with an immutable genesis block (Index 0).
   */
  async createGenesisBlock(projectId, submitterId) {
    const timestamp = Date.now();
    const currentHash = hashBlock('0', submitterId, { genesis: true }, timestamp);

    return await ContributionBlock.create({
      projectId,
      blockIndex: 0,
      isGenesis: true,
      previousHash: '0',
      currentHash,
      contributorId: submitterId,
      deltaData: { genesis: true },
      contributionType: 'ALGORITHM',
      complexityCoefficient: 1.0,
      timestamp,
      keyVersion: process.env.KEY_VERSION || 'v1'
    });
  }

  /**
   * Appends a new contribution to the مشروع (Project) chain.
   */
  async addBlock(projectId, contributorId, deltaData, contributionType) {
    const lastBlock = await ContributionBlock.findOne({ projectId }).sort({ blockIndex: -1 });
    if (!lastBlock) throw new Error('Ledger Error: Genesis block missing');

    const timestamp = Date.now();
    const currentHash = hashBlock(lastBlock.currentHash, contributorId, deltaData, timestamp);

    return await ContributionBlock.create({
      projectId,
      blockIndex: lastBlock.blockIndex + 1,
      previousHash: lastBlock.currentHash,
      currentHash,
      contributorId,
      deltaData,
      contributionType,
      timestamp,
      keyVersion: process.env.KEY_VERSION || 'v1'
    });
  }

  /**
   * Verifies the cryptographic integrity of the entire project chain.
   */
  async verifyChain(projectId) {
    const chain = await ContributionBlock.find({ projectId }).sort({ blockIndex: 1 });
    
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      const prevHash = (i === 0) ? '0' : chain[i - 1].currentHash;

      // 1. Verify Hash Continuity
      if (block.previousHash !== prevHash) {
        await logSecurityEvent('TAMPER_DETECTED', 'critical', null, { ip: 'internal', headers: {} }, { 
          projectId, 
          blockIndex: block.blockIndex,
          reason: 'Chain discontinuity' 
        });
        return { valid: false, error: `Chain break at block ${block.blockIndex}` };
      }

      // 2. Verify HMAC Signature
      const isValid = verifyBlockHmac(
        block.currentHash,
        block.previousHash,
        block.contributorId.toString(),
        block.deltaData,
        block.timestamp
      );

      if (!isValid) {
        await logSecurityEvent('TAMPER_DETECTED', 'critical', null, { ip: 'internal', headers: {} }, {
          projectId,
          blockIndex: block.blockIndex,
          reason: 'Invalid HMAC signature'
        });
        return { valid: false, error: `Tamper detected at block ${block.blockIndex}` };
      }
    }

    return { valid: true, chainLength: chain.length };
  }

  /**
   * CRON Task: Performs a system-wide integrity sweep.
   */
  async runIntegritySweep() {
    const projects = await Project.find({ isActive: true });
    logger.info(`[LEDGER] Starting integrity sweep for ${projects.length} projects...`);
    
    for (const project of projects) {
      const res = await this.verifyChain(project._id);
      if (!res.valid) {
        logger.error(`[LEDGER] CRITICAL TAMPER in project ${project.title}: ${res.error}`);
      }
    }
  }

  async getChain(projectId) {
    return await ContributionBlock.find({ projectId }).sort({ blockIndex: 1 });
  }
}

module.exports = new LedgerService();
