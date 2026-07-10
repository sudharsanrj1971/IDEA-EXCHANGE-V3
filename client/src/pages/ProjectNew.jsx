import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../services/all.api';
import { Loader2, Plus, X, Globe, Code, Shield } from 'lucide-react';

export default function ProjectNew() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [techStack, setTechStack] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!techStack.includes(tagInput.trim())) {
        setTechStack([...techStack, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setTechStack(techStack.filter(t => t !== tag));
  };

  const onSubmit = async (data) => {
    try {
      const res = await projectApi.createProject({
        ...data,
        techStack
      });
      navigate(`/projects/${res.data.data.project._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-white tracking-tight">Initiate Innovation Genesis</h1>
        <p className="text-gray-500 text-sm mt-1">Founding a project creates the genesis block (Block #0) in the institutional ledger.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface p-8 rounded-3xl border border-white/5 space-y-8 shadow-2xl">
        <div className="space-y-6">
          <section>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={14}/> Core Identity
            </label>
            <div className="space-y-4">
              <div>
                <input 
                  {...register('title', { required: 'Project title is required' })} 
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg font-bold text-white placeholder:text-gray-700 focus:border-primary outline-none transition-all" 
                  placeholder="e.g., Decentralized Academic Ledger v1.0"
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-2 font-bold px-1">{errors.title.message}</p>}
              </div>
              
              <div>
                <textarea 
                  {...register('problemStatement', { 
                    required: 'Problem statement is required', 
                    minLength: { value: 50, message: 'Minimum 50 characters required for technical clarity' } 
                  })} 
                  rows={4}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-700 focus:border-primary outline-none transition-all resize-none" 
                  placeholder="Define the technical challenge or problem statement this project addresses..."
                />
                {errors.problemStatement && <p className="text-[10px] text-red-500 mt-2 font-bold px-1">{errors.problemStatement.message}</p>}
              </div>
            </div>
          </section>

          <section>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Code size={14}/> Infrastructure Stack
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-gray-700 focus:border-primary outline-none transition-all" 
                  placeholder="Type a technology and press Enter (e.g., Mongoose, Redis)"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-gray-600 uppercase">Enter to Add</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {techStack.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs font-bold text-primary group animate-in fade-in zoom-in duration-200">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-primary/40 hover:text-primary transition-colors">
                      <X size={12}/>
                    </button>
                  </span>
                ))}
                {techStack.length === 0 && <p className="text-xs text-gray-700 italic">No technologies added yet</p>}
              </div>
            </div>
          </section>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex items-start gap-4">
             <div className="p-2 bg-primary/10 rounded-xl text-primary mt-1">
               <Shield size={20}/>
             </div>
             <div>
               <h4 className="text-sm font-bold text-white mb-1">Genesis Immutability</h4>
               <p className="text-xs text-gray-400 leading-relaxed">By creating this project, you will be recorded as the <span className="text-primary font-bold underline">Root Owner</span>. All future contributions from collaborators will be hashed against your initial genesis block.</p>
             </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/80 transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={24} className="animate-spin"/> : <><Plus size={20}/> Create Genesis Record</>}
        </button>
      </form>
    </div>
  );
}
