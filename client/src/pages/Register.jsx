import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/all.api';
import { Loader2 } from 'lucide-react';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [serverError, setServerError] = React.useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await authApi.register(data);
      navigate('/login');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold text-primary tracking-tighter">IdeaXchange</Link>
          <h2 className="text-xl text-white font-bold mt-6">Create Institutional Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join the network of academic innovation.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface p-8 rounded-3xl border border-white/5 shadow-2xl">
          {serverError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
               <input {...register('name', { required: 'Name is required' })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary" placeholder="Jane Doe" />
               {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Institutional Email</label>
               <input {...register('email', { required: 'Email is required' })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary" placeholder="jane@university.edu" />
               {errors.email && <p className="text-[10px] text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Student/Faculty ID</label>
               <input {...register('studentId', { required: 'ID is required' })} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary" placeholder="ID12345" />
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Department</label>
               <select {...register('department')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary appearance-none">
                 {['CSE', 'IT', 'ECE', 'MECH', 'CIVIL'].map(dept => <option key={dept} value={dept} className="bg-surface">{dept}</option>)}
               </select>
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Batch Year</label>
               <select {...register('batchYear')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary appearance-none">
                 {[2021, 2022, 2023, 2024, 2025].map(year => <option key={year} value={year} className="bg-surface">{year}</option>)}
               </select>
            </div>

            <div className="md:col-span-2">
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Role</label>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {['student', 'faculty', 'expert', 'stakeholder'].map(role => (
                   <label key={role} className="cursor-pointer">
                     <input {...register('role')} type="radio" value={role} className="sr-only peer" />
                     <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-center uppercase tracking-widest text-gray-500 peer-checked:bg-primary/10 peer-checked:border-primary peer-checked:text-primary transition-all">
                       {role}
                     </div>
                   </label>
                 ))}
               </div>
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
               <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} type="password" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary" placeholder="••••••••" />
               {errors.password && <p className="text-[10px] text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
               <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
               <input 
                 {...register('confirmPassword', { 
                   required: 'Please confirm password', 
                   validate: (val) => watch('password') === val || 'Passwords do not match' 
                 })} 
                 type="password" 
                 className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-primary" 
                 placeholder="••••••••" 
               />
               {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 transition-all flex items-center justify-center gap-2 mt-8 shadow-lg"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : 'Create Account'}
          </button>

          <div className="mt-4 flex items-center justify-between">
            <span className="w-1/5 border-b border-white/5 lg:w-1/4"></span>
            <span className="text-xs text-center text-gray-500 uppercase">or</span>
            <span className="w-1/5 border-b border-white/5 lg:w-1/4"></span>
          </div>
          <GoogleLoginButton />

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-xs text-gray-500">
              Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
