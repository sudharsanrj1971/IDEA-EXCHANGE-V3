import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Database, Shield, Zap, TrendingUp, Users, Award } from 'lucide-react';

export default function Landing() {
  return (
    <div className="pt-20 pb-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
          <Zap size={14}/> Now Live: Decentralized Academic Ledger
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-tight mb-6">
          Secure <span className="text-primary italic">Student Innovation</span> with IdeaXchange
        </h1>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The first MERN-stack decentralized micro-contribution platform. Verify collaboration, automate certification, and secure stakeholder funding for academic excellence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/80 transition-all shadow-[0_0_40px_rgba(79,142,247,0.3)] flex items-center justify-center gap-2 group">
            Get Started <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
            Sign In
          </Link>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 px-6 max-w-6xl mx-auto">
        {[
          { icon: Database, title: "JSON-Chain Ledger", desc: "Every contribution is hashed (SHA-256) and chained, creating an immutable proof of work." },
          { icon: Shield, title: "TSS Governance", desc: "Critical project decisions handled through Threshold Secret Sharing multi-sig quorum." },
          { icon: Award, title: "Quality×Impact Scoring", desc: "Automated PIS algorithm favors adoption rates and peer-expert alignment." }
        ].map((feature, i) => (
          <div key={i} className="bg-surface p-8 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <feature.icon size={24}/>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-32 bg-primary/5 py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Pilot Results from Q1</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-4xl font-bold text-primary">288%</p>
                <p className="text-xs text-gray-500 uppercase font-bold mt-1">Iteration Speed ↑</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">80%</p>
                <p className="text-xs text-gray-500 uppercase font-bold mt-1">Dropout Rate ↓</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">92.4%</p>
                <p className="text-xs text-gray-500 uppercase font-bold mt-1">Attribution Accuracy</p>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary"/>
                <p className="text-xs text-gray-500 italic">500+ Active Researchers</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {['Node.js', 'MongoDB', 'Redis', 'React', 'Docker', 'Nginx'].map(tech => (
               <div key={tech} className="px-6 py-4 bg-surface rounded-2xl border border-white/5 text-center text-sm font-bold text-gray-400 group hover:text-white transition-colors">
                 {tech}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
