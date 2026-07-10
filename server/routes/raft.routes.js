const express = require('express');
const raftService = require('../services/raft.service');
const raftAuth = require('../middleware/raftAuth.middleware');
const { success } = require('../utils/apiResponse');

const router = express.Router();

// FIX 06: Protect ALL inter-node consensus routes with RaftAuth
router.use(raftAuth);

router.post('/heartbeat', async (req, res) => {
  const { leaderId, term } = req.body;
  await raftService.receiveHeartbeat(leaderId, term);
  success(res, { ok: true });
});

router.post('/vote', async (req, res) => {
  const { candidateId, term } = req.body;
  const result = await raftService.receiveVote(candidateId, term);
  success(res, result);
});

module.exports = router;
