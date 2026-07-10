import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp, Fingerprint, Clock, Activity } from 'lucide-react';

export function BlockCard({ block, scoreDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20 transition-all group">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="text-xs font-bold">#{block.blockIndex}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{block.contributorId?.name}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">{block.contributionType} Contribution</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Clock size={12}/>
              {new Date(block.timestamp).toLocaleDateString()}
            </div>
            {scoreDetails && (
              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20 text-[10px] font-bold">
                <Activity size={10}/>
                {scoreDetails.score?.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 py-3 border-y border-white/5 my-2">
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Previous Hash</p>
            <p className="text-[10px] font-mono text-gray-400 break-all leading-tight">{block.previousHash.substring(0, 24)}...</p>
          </div>
          <div className="w-px h-8 bg-white/5" />
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Current Hash</p>
            <p className="text-[10px] font-mono text-primary break-all leading-tight">{block.currentHash.substring(0, 24)}...</p>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-gray-500 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          {isExpanded ? 'Show Less' : 'View Delta Data'}
        </button>

        {isExpanded && (
          <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
             <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold flex items-center gap-2">
              <Fingerprint size={12}/> Data Payload
             </p>
             <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">
               {JSON.stringify(block.deltaData, null, 2)}
             </pre>
          </div>
        )}
      </div>
    </div>
  );
}
