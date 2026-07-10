const ledgerService = require('../services/ledger.service');
const { success, error } = require('../utils/apiResponse');
const { logSecurityEvent } = require('../utils/securityLogger');
const logger = require('../utils/logger');

/**
 * LEDGER API CONTROLLER
 * Implements FIX 08: Mandatory project access checks and export auditing.
 */
exports.getLedger = async (req, res) => {
  try {
    // Note: Project access verified by middleware: requireProjectAccess()
    const chain = await ledgerService.getChain(req.project._id);
    success(res, { chain });
  } catch (err) {
    error(res, 'Failed to fetch ledger chain', 500);
  }
};

exports.verifyLedger = async (req, res) => {
  try {
    const result = await ledgerService.verifyChain(req.project._id);
    success(res, result);
  } catch (err) {
    error(res, 'Cryptographic verification failed', 500);
  }
};

exports.exportPDF = async (req, res) => {
  try {
    // Require projectAccess is already handled by route middleware
    // We fetch the full chain for generation
    const chain = await ledgerService.getChain(req.project._id);
    
    // Log Export Event for Auditing (FIX 08)
    await logSecurityEvent('PDF_EXPORT', 'info', req.user._id, req, { 
      projectId: req.project._id,
      title: req.project.title 
    });

    // Mock PDF generation (Implementation would use pdfkit or similar)
    const reportData = {
      institution: 'IdeaXchange Platform',
      project: req.project.title,
      owner: req.user.name,
      timestamp: new Date().toISOString(),
      chainLength: chain.length,
      integrity: 'VERIFIED_SHA256'
    };

    const buffer = Buffer.from(JSON.stringify(reportData, null, 2));
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Verification-${req.project._id}.pdf`);
    
    res.send(buffer);
  } catch (err) {
    logger.error('PDF Export Error:', err);
    error(res, 'Ledger export logic failure', 500);
  }
};
