const express = require('express');
const ledgerController = require('../controllers/ledger.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validator.middleware');

const router = express.Router();

router.get('/:id', verifyToken, validateObjectId(), ledgerController.getLedger);
router.get('/:id/verify', verifyToken, validateObjectId(), ledgerController.verifyLedger);
router.get('/:id/export-pdf', verifyToken, validateObjectId(), ledgerController.exportPDF);

module.exports = router;
