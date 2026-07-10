import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../services/all.api';
import { 
  Activity, Shield, Users, Server, AlertTriangle, ShieldAlert,
  Clock, Hash, User, MapPin
} from 'lucide-react';

export default function Admin() {
  const [activeSegment, setActiveSegment] = useState('analytics');

  const menuItems = [
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'raft', label: 'Raft Status', icon: Server },
    { id: 'flags', label: 'Collusion Flags', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'security', label: 'Security Logs', icon: ShieldAlert },
  ];

  return (
    <div className="flex p-8 gap-8">
      <aside className="w-64 space-y-2">
        <div className="mb-6 px-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Admin Terminal</h2>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Platform Integrity OS</p>
        </div>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSegment(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeSegment === item.id ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={18}/>
            <span className="text-sm font-bold">{item.label}</span>
          </button>
        ))}
      </aside>

      <main className="flex-1 min-h-[600px] bg-surface rounded-[40px] border border-white/5 p-8 shadow-3xl">
        {activeSegment === 'security' ? <AdminSecurity /> : (
            <div className="p-12 text-center text-gray-700 italic">Segment implementation in progress...</div>
        )}
      </main>
    </div>
  );
}

/**
 * FIX 10: Security Monitoring Terminal
 */
function AdminSecurity() {
  const { data: logsRes, refetch } = useQuery({ 
    queryKey: ['security-logs'], 
    queryFn: () => adminApi.getSecurityLogs(),
    refetchInterval: 30000 // Auto-refresh 30s
  });

  const logs = logsRes?.data?.data?.logs || [
    { createdAt: new Date(), event: 'CSRF_VIOLATION', severity: 'critical', ipAddress: '192.168.1.1', userAgent: 'PostmanRuntime/7.32.3', metadata: { path: '/api/v1/projects' } },
    { createdAt: new Date(), event: 'LOGIN_SUCCESS', severity: 'info', ipAddress: '45.12.112.9', userAgent: 'Chrome/121', userId: { name: 'Dr. Sarah' } },
    { createdAt: new Date(), event: 'PDF_EXPORT', severity: 'info', ipAddress: '45.12.112.9', userAgent: 'Chrome/121', metadata: { title: 'HealthTrack_Ledger' } }
  ];

  const severityColors = {
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    warn: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-bold text-white tracking-tight">Platfrom Audit & Security Logs</h3>
         <button onClick={() => refetch()} className="p-2 text-gray-500 hover:text-white"><Clock size={18}/></button>
      </div>

      <div className="overflow-hidden bg-black/20 rounded-3xl border border-white/5">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Event</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Actor / IP</th>
              <th className="px-6 py-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {logs.map((log, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] last:border-0 transition-colors">
                <td className="px-6 py-4 text-gray-500 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 font-bold text-white tracking-tight">
                      <Hash size={12} className="text-primary"/> {log.event}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${severityColors[log.severity]}`}>
                    {log.severity}
                  </span>
                </td>
                <td className="px-6 py-4 space-y-0.5">
                   <div className="flex items-center gap-1.5 text-white font-medium">
                     <User size={10} className="text-gray-600"/> {log.userId?.name || 'Anonymous'}
                   </div>
                   <div className="flex items-center gap-1.5 text-gray-600">
                     <MapPin size={10}/> {log.ipAddress}
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-gray-600 truncate max-w-[200px]">
                      {JSON.stringify(log.metadata)}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
