import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Layout/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectNew from './pages/ProjectNew';
import ProjectDetail from './pages/ProjectDetail';
import Portfolio from './pages/Portfolio';
import FundingBoard from './pages/FundingBoard';
import Admin from './pages/Admin';

import { useAuthStore } from './store/authStore';
import { authApi } from './services/all.api';

export default function App() {
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await authApi.getMe();
        setAuth(res.data.data.user);
      } catch (err) {
        clearAuth();
      }
    };
    verifySession();
  }, []);

  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary/30">
      {!hideNavbar && <Navbar />}
      
      <main className={!hideNavbar ? 'max-w-7xl mx-auto' : ''}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/new" element={<ProjectNew />} />
            <Route path="/projects/:id/*" element={<ProjectDetail />} />
            <Route path="/funding" element={<FundingBoard />} />
            <Route path="/portfolio/:userId" element={<Portfolio />} />
          </Route>

          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/*" element={<Admin />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
