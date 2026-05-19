import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { Home, Rss, LogOut, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    auth.signOut();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Feed', path: '/feed', icon: Rss },
  ];

  return (
    <nav className="h-16 bg-brand-surface border-b border-cyan-900/50 flex items-center justify-between px-8 shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-brand-bg" />
        </div>
        <Link to="/dashboard" className="text-xl font-bold text-brand-accent tracking-tighter">
          CitizenAlert
        </Link>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest text-slate-400">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`pb-1 transition-colors hover:text-brand-accent ${
              location.pathname === item.path ? 'text-brand-accent border-b-2 border-brand-accent' : ''
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Active User</p>
          <p className="text-sm font-semibold text-slate-200">{user.displayName || 'User'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full border-2 border-cyan-500/30 bg-slate-700 flex items-center justify-center hover:border-brand-accent transition-all text-slate-400 hover:text-brand-accent"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
