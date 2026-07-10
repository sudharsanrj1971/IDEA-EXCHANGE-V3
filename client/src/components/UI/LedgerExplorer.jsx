import React, { useState } from 'react';
import { ledgerApi } from '../../services/all.api';
import { BlockCard } from './BlockCard';
import { ShieldCheck, ShieldAlert, Download, RefreshCw } from 'lucide-react';

export function LedgerExplorer({ projectId }) {
  const [blocks, setBlocks] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await ledgerApi.getChain(projectId);
      setBlocks(res.data.data.chain);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const res = await ledgerApi.verifyChain(projectId);
      setVerificationResult(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await ledgerApi.exportPDF(projectId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ledger-${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchLedger();
  }, [projectId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Decentralized Micro-Contribution Ledger</h3>
          <p className="text-xs text-gray-500 mt-1">Immutable SHA-256 chained records with institutional signing.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleVerify}
            disabled={verifying}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
              verificationResult?.valid === true ? 'bg-green-500/10 text-green-500 border-green-500/20' :
              verificationResult?.valid === false ? 'bg-red-500/10 text-red-500 border-red-500/20' :
              'bg-white/5 text-white border-white/10 hover:bg-white/10'
            }`}
          >
            {verifying ? <RefreshCw size={14} className="animate-spin"/> : 
             verificationResult?.valid === true ? <ShieldCheck size={14}/> : 
             verificationResult?.valid === false ? <ShieldAlert size={14}/> : <RefreshCw size={14}/>}
            {verifying ? 'Verifying...' : verificationResult ? (verificationResult.valid ? 'Verified' : 'Tamper Detected') : 'Verify Chain'}
          </button>
          
          <button 
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/80 transition-all shadow-[0_0_20px_rgba(79,142,247,0.3)]"
          >
            <Download size={14}/> Export PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <div key={block._id} className="relative">
            {idx > 0 && (
              <div className="absolute top-[-16px] left-10 w-0.5 h-4 bg-primary/20" />
            )}
            <BlockCard block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}
