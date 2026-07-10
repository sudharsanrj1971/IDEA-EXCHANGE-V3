import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fundingApi } from '../services/all.api';
import { useAuthStore } from '../store/authStore';
import { StateBadge, ScoreGauge } from '../components/UI/Basic';
import { DollarSign, Search, Filter, TrendingUp, Users, ExternalLink } from 'lucide-react';

export default function FundingBoard() {
  const { user } = useAuthStore();
  const [filterDept, setFilterDept] = useState('ALL');
  
  const { data: fundingRes, isLoading } = useQuery({
    queryKey: ['funding-opportunities'],
    queryFn: () => fundingApi.getCertified()
  });

  const opportunities = fundingRes?.data?.data?.projects || [];

  if (isLoading) return <div className="p-20 text-center text-gray-500">Scanning Certified Innovations...</div>;

  return (
    <div className="p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Institutional Funding Board
          <span className="text-xs font-bold px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg uppercase tracking-widest">Stakeholder Hub</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">High-impact student projects validated by the Ledger Integrity Protocol.</p>
      </header>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700" size={18}/>
          <input className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-2xl text-sm text-white focus:border-primary outline-none" placeholder="Search by technical problem or tech stack..." />
        </div>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-white/10">
          {['ALL', 'CSE', 'IT', 'ECE', 'MECH'].map(dept => (
            <button 
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterDept === dept ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.length === 0 ? (
          <div className="col-span-full py-20 bg-surface/50 border border-dashed border-white/10 rounded-3xl text-center text-gray-600">
             No certified projects currently awaiting funding. Verification cycles are ongoing.
          </div>
        ) : (
          opportunities.map(opp => (
            <div key={opp._id} className="bg-surface rounded-3xl border border-white/5 overflow-hidden hover:border-primary/30 transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Certified Innovation</p>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{opp.title}</h3>
                  </div>
                  <ScoreGauge score={opp.impactScore || 0} />
                </div>
                
                <p className="text-xs text-gray-400 mb-6 line-clamp-3 leading-relaxed">{opp.problemStatement}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-primary mb-1">
                       <TrendingUp size={14}/>
                       <span className="text-[10px] font-bold uppercase">Growth PIS</span>
                    </div>
                    <p className="text-xs font-bold text-white">+24.8% <span className="text-gray-600 font-normal">w/o/w</span></p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 text-green-500 mb-1">
                       <Users size={14}/>
                       <span className="text-[10px] font-bold uppercase">Contributors</span>
                    </div>
                    <p className="text-xs font-bold text-white">{opp.collaboratorCount} <span className="text-gray-600 font-normal">verified</span></p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                   {opp.techStack.map(tag => (
                     <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-gray-500 uppercase">{tag}</span>
                   ))}
                </div>
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user?.role === 'stakeholder' ? (
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/80 transition-all">
                       <DollarSign size={14}/> Express Interest
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest pl-2">Stakeholder-only Action</span>
                  )}
                </div>
                <button className="p-2 text-gray-600 hover:text-white transition-colors">
                  <ExternalLink size={18}/>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
