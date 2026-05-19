import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Mail, Lock, User, Loader2 } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    return pass.length >= 7 && /[A-Z]/.test(pass);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword(password)) {
      setError('Password must be at least 7 characters long and include one capital letter.');
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Auth Profile
      await updateProfile(user, { displayName: name });
      
      // Save User Data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: new Date().toISOString()
      });
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-6 mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card-gradient p-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center mb-4 border border-brand-accent/20">
            <ShieldAlert className="text-brand-accent w-10 h-10" />
          </div>
          <h1 className="text-3xl font-light text-slate-100 italic uppercase tracking-tighter">Join the <span className="font-bold text-brand-accent">Network</span></h1>
          <p className="text-sm text-slate-500 uppercase tracking-widest mt-2 font-bold font-mono text-center">New Sentinel Registration</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="label-caps">Sentinel Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="label-caps">Network Link (Email)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@network.com"
              />
            </div>
          </div>

          <div>
            <label className="label-caps">Access Code (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-2 font-mono uppercase">Min 7 chars, at least one capital letter.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono">
              [DENIED]: {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Sentinel'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already verified?{' '}
          <Link to="/login" className="text-brand-accent hover:underline decoration-brand-accent/30 underline-offset-4">
            Network Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
