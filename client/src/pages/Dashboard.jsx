import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { projectApi } from '../services/all.api';
import { useAuthStore } from '../store/authStore';
import { StateBadge, ScoreGauge } from '../components/UI/Basic';
import { Plus, LayoutGrid, Clock, Award, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectApi.getProjects(1, 10)
  });

  if (isLoading) return <div className="p-12 text-center text-gray-500 animate-pulse">Synchronizing Dashboard...</div>;

  const projects = projectsData?.data?.data?.projects || [];

  return (
    <div className="p-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
             Welcome back, {user?.name.split(' ')[0]}
             <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[10px] uppercase tracking-widest border border-primary/20">
               <Award size={10}/> {user?.reputationPoints || 0} RP
             </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Institutional Ledger Portfolio Status: ACTIVE</p>
        </div>
        <Link to="/projects/new" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/80 transition-all shadow-[0_0_30px_rgba(79,142,247,0.2)]">
          <Plus size={18}/> New Project
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <LayoutGrid size={14}/> Active Projects
              </h2>
            </div>
            {projects.length === 0 ? (
              <div className="bg-surface/50 border border-dashed border-white/10 rounded-3xl p-12 text-center text-gray-500">
                No active projects found. Start by creating a project.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(project => (
                  <Link key={project._id} to={`/projects/${project._id}`} className="block bg-surface p-6 rounded-3xl border border-white/5 hover:border-primary/30 hover:scale-[1.02] transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <StateBadge state={project.state} />
                      <ScoreGauge score={project.impactScore || 0} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-6 leading-relaxed">{project.problemStatement}</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                       <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Last updated 2h ago</span>
                       <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full bg-white/5 border-2 border-surface flex items-center justify-center text-[8px] font-bold text-gray-400">
                             {i}
                           </div>
                         ))}
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
             <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Activity size={14}/> Recent Network Activity
             </h2>
             <div className="bg-surface rounded-3xl border border-white/5 p-6 space-y-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-4 group cursor-pointer border-b border-white/5 pb-6 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                      <Clock size={16}/>
                    </div>
                    <div>
                      <p className="text-xs text-gray-300 font-medium">New block #104 added to <span className="text-white font-bold">HealthTrack</span></p>
                      <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-bold">12 minutes ago</p>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
             <h3 className="text-sm font-bold text-primary mb-2 tracking-tight">Certification Pathway</h3>
             <p className="text-xs text-gray-400 leading-relaxed">Your projects need <span className="text-white font-bold">3 peer reviews</span> and <span className="text-white font-bold">1 expert validation</span> to reach Certified status.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
