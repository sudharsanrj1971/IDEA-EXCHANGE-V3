import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { authApi, projectApi } from '../services/all.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, Code, Globe, MessageSquare, Download, Map } from 'lucide-react';

export default function Portfolio() {
  const { userId } = useParams();

  const { data: userRes, isLoading: userLoading } = useQuery({
    queryKey: ['user-portfolio', userId],
    queryFn: () => authApi.getMe() // Using getMe for now as we'd need a specific public profile API
  });

  const user = userRes?.data?.data?.user;

  const chartData = [
    { type: 'ALGO', count: 12, color: '#4f8ef7' },
    { type: 'UIUX', count: 8, color: '#10b981' },
    { type: 'DOCS', count: 15, color: '#f59e0b' },
    { type: 'RESR', count: 5, color: '#a855f7' },
  ];

  if (userLoading) return <div className="p-20 text-center text-gray-500">Compiling Individual Portfolio...</div>;

  return (
    <div className="p-8 pb-32">
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface rounded-3xl border border-white/5 p-8 text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 transition-transform duration-700 blur-3xl opacity-20" />
               <div className="relative">
                 <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-gray-700">
                   {user?.name.charAt(0)}
                 </div>
                 <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{user?.department} • Batch of {user?.batchYear}</p>
                 
                 <div className="mt-8 flex flex-col gap-3">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Impact Score</p>
                      <p className="text-2xl font-bold text-primary">8.4<span className="text-sm font-medium text-gray-700">/10</span></p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Reputation Points</p>
                      <p className="text-2xl font-bold text-amber-500">{user?.reputationPoints || 0}</p>
                   </div>
                 </div>
               </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
              <Download size={18}/> Export Verification
            </button>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-surface rounded-3xl border border-white/5 p-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Contribution DNA</h3>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="type" stroke="#333" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.02)'}}
                      contentStyle={{backgroundColor: '#16161f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px'}}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface rounded-3xl border border-white/5 p-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Recent Reputation Events</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Substantive Review', points: '+15', time: '2 days ago', color: 'text-green-500' },
                    { label: 'Blockchain Commit', points: '+5', time: '3 days ago', color: 'text-primary' },
                    { label: 'Certified Release', points: '+100', time: '1 week ago', color: 'text-amber-500' }
                  ].map((event, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{event.label}</p>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{event.time}</p>
                      </div>
                      <span className={`text-sm font-bold ${event.color}`}>{event.points}</span>
                    </div>
                  ))}
                </div>
              </div>

               <div className="bg-surface rounded-3xl border border-white/5 p-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Institutional Standing</h3>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden">
                   <Award size={64} className="absolute -right-4 -bottom-4 text-white hover:text-primary transition-colors opacity-10" />
                   <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-4">Verification Status</p>
                   <div className="flex items-center gap-3 mb-4">
                     <ShieldCheck size={24} className="text-primary"/>
                     <span className="text-lg font-bold text-white tracking-tight">Level 4 Innovator</span>
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed">Authorized to lead <span className="text-white font-bold">5 critical quorums</span> and access stakeholder funding board.</p>
                </div>
              </div>
            </div>
          </div>
       </div>
    </div>
  );
}

function ShieldCheck({ size, className }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
