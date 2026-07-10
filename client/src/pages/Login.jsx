import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/all.api';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.data.user);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold text-primary tracking-tighter">IdeaXchange</Link>
          <h2 className="text-xl text-white font-bold mt-6">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to your decentralized innovation hub.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl">
          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
              {serverError}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Institutional Email</label>
              <input 
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } })}
                type="email" 
                placeholder="john@university.edu"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              {errors.email && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input 
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : 'Sign In'}
            </button>
          </div>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-xs text-gray-500">
              Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Register Now</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
