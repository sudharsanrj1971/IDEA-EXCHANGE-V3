const axios = require('axios');
const RaftNode = require('../models/RaftNode.model');
const logger = require('../utils/logger');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * REPLICATED STATE MACHINE - RAFT CONSENSUS SERVICE
 * Handles election logic and inter-node coordination using secure RPCs.
 */
class RaftService {
  constructor() {
    this.nodeId = process.env.NODE_ID || 'standalone';
    this.currentTerm = 0;
    this.votedFor = null;
    this.role = 'follower';
    this.peers = (process.env.RAFT_PEERS || '').split(',').filter(Boolean);
    this.rpcTimeout = 3000; // FIX 06: Strict RPC timeout
  }

  /**
   * Broadcasts secure heartbeat to all peers.
   */
  async broadcastHeartbeat() {
    if (this.role !== 'leader') return;

    for (const peer of this.peers) {
      try {
        await axios.post(`${peer}/raft/heartbeat`, {
          leaderId: this.nodeId,
          term: this.currentTerm
        }, {
          headers: { 'X-Raft-Secret': process.env.RAFT_INTERNAL_SECRET }, // FIX 06: Secure Header
          timeout: this.rpcTimeout
        });
      } catch (err) {
        logger.warn(`[RAFT] Peer ${peer} unreachable during heartbeat`);
      }
    }
  }

  /**
   * Initiates a leader election.
   */
  async requestVotes() {
    this.role = 'candidate';
    this.currentTerm += 1;
    this.votedFor = this.nodeId;
    let votes = 1;

    for (const peer of this.peers) {
      try {
        const res = await axios.post(`${peer}/raft/vote`, {
          candidateId: this.nodeId,
          term: this.currentTerm
        }, {
          headers: { 'X-Raft-Secret': process.env.RAFT_INTERNAL_SECRET },
          timeout: this.rpcTimeout
        });

        if (res.data.voteGranted) votes += 1;
      } catch (err) {
        logger.warn(`[RAFT] Vote request failed to ${peer}`);
      }
    }

    if (votes > (this.peers.length + 1) / 2) {
      this.role = 'leader';
      logger.info(`[RAFT] Node ${this.nodeId} elected as LEADER for term ${this.currentTerm}`);
    }
  }

  async receiveHeartbeat(leaderId, term) {
    if (term >= this.currentTerm) {
      this.currentTerm = term;
      this.role = 'follower';
      this.votedFor = null;
    }
  }

  async receiveVote(candidateId, term) {
    if (term > this.currentTerm && !this.votedFor) {
      this.votedFor = candidateId;
      return { voteGranted: true };
    }
    return { voteGranted: false };
  }

  async getClusterStatus() {
    return await RaftNode.find();
  }

  async simulateCrash(nodeId) {
    await logSecurityEvent('SYBIL_ATTEMPT', 'warn', null, { ip: 'system' }, { 
      action: 'CRASH_SIMULATION_TRIGGERED', 
      targetNode: nodeId 
    });
    // Implementation would stop the local event loop or skip heartbeats
  }
}

module.exports = new RaftService();
