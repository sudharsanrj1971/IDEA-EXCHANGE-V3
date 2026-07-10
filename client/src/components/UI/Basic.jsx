import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ role }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

export function StateBadge({ state }) {
  const styles = {
    SUBMITTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COLLABORATING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    VALIDATING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    CERTIFIED: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[state] || ''}`}>
      {state}
    </span>
  );
}

export function ScoreGauge({ score = 0 }) {
  const color = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444';
  const percentage = (score / 10) * 100;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5"/>
        <circle 
          cx="48" cy="48" r={radius} 
          stroke={color} strokeWidth="6" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-white leading-none">{score.toFixed(1)}</span>
        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">PIS</span>
      </div>
    </div>
  );
}
