import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, LayoutDashboard, Database, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/uiStores';
import socket from '../../services/socket';

export default function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const { unreadCount, addNotification } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.on('notification:new', (data) => {
        addNotification(data.notification);
      });
    }
    return () => socket.off('notification:new');
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    socket.disconnect();
    navigate('/login');
  };

  return (
    <nav className="bg-surface border-b border-white/5 h-16 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-primary tracking-tighter">IdeaXchange</Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2"><LayoutDashboard size={18}/> Dashboard</Link>
          <Link to="/projects/new" className="text-gray-400 hover:text-white flex items-center gap-2"><Database size={18}/> New Project</Link>
          <Link to="/funding" className="text-gray-400 hover:text-white flex items-center gap-2"><DollarSign size={18}/> Funding</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer hover:bg-white/5 p-2 rounded-full transition-colors">
          <Bell size={20} className="text-gray-400"/>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-surface">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-white">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20}/>
          </button>
        </div>
      </div>
    </nav>
  );
}
