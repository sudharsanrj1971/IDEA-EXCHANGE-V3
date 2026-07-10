import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Info, GitCommit, Shield, Hash, Layers } from 'lucide-react';

export default function Sidebar({ projectState }) {
  const { id } = useParams();

  const links = [
    { to: `/projects/${id}`, label: 'Overview', icon: Info },
    { to: `/projects/${id}/contributions`, label: 'Contributions', icon: GitCommit },
    { to: `/projects/${id}/ledger`, label: 'Ledger', icon: Hash },
    { to: `/projects/${id}/governance`, label: 'Governance', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-surface/50 border-r border-white/5 h-[calc(100vh-64px)] p-4 flex flex-col">
      <div className="mb-8">
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 px-2">Project Navigation</p>
        <div className="space-y-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(79,142,247,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <link.icon size={18}/>
              <span className="text-sm font-medium">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/5">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Project State</label>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            projectState === 'CERTIFIED' ? 'bg-green-500' : 
            projectState === 'VALIDATING' ? 'bg-purple-500' :
            projectState === 'COLLABORATING' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
          <span className="text-xs font-bold text-white tracking-tight">{projectState}</span>
        </div>
      </div>
    </aside>
  );
}
