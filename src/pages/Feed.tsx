import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, User, Edit3, Trash2, Filter, AlertCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Feed() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
    
    if (categoryFilter !== 'All') {
      q = query(collection(db, 'incidents'), where('category', '==', categoryFilter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Check for new incidents to notify
      if (!loading && snapshot.docChanges().some(change => change.type === 'added')) {
        const newIncident = snapshot.docChanges().find(c => c.type === 'added')?.doc.data();
        if (newIncident && newIncident.userId !== user?.uid) {
          setNotification(`New ${newIncident.category} reported: ${newIncident.title}`);
          setTimeout(() => setNotification(null), 5000);
        }
      }

      setIncidents(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'incidents');
    });

    return () => unsubscribe();
  }, [categoryFilter, loading, user?.uid]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteDoc(doc(db, 'incidents', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `incidents/${id}`);
      }
    }
  };

  const categories = ['All', 'Accident', 'Fighting', 'Rioting', 'Traffic', 'Other'];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-brand-accent text-brand-bg px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold border-2 border-white/20"
          >
            <Bell className="w-5 h-5 animate-bounce" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Live Incident Feed</h1>
          <p className="text-slate-400 mt-1">Real-time reports from citizens across the community.</p>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <Filter className="text-slate-500 w-5 h-5 shrink-0" />
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                categoryFilter === cat 
                ? 'bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20' 
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card-gradient h-64 animate-pulse"></div>
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <AlertCircle className="w-16 h-16 mb-4 opacity-10" />
          <p className="text-xl font-light italic">No incidents detected in this sector.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map((incident) => (
            <motion.div 
              layout
              key={incident.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-gradient overflow-hidden flex flex-col group h-full"
            >
              <div className="h-40 bg-slate-800 relative overflow-hidden">
                <img 
                  src={incident.imageUrl} 
                  alt={incident.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60"
                />
                <span className={`absolute top-3 right-3 text-[9px] font-bold text-white px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                  incident.category === 'Accident' ? 'bg-red-500' :
                  incident.category === 'Fighting' ? 'bg-orange-500' :
                  incident.category === 'Rioting' ? 'bg-purple-600' :
                  incident.category === 'Traffic' ? 'bg-cyan-500 text-brand-bg' :
                  'bg-slate-700'
                }`}>
                  {incident.category || 'General'}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight line-clamp-1">{incident.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-2">
                    {incident.createdAt ? formatDistanceToNow(incident.createdAt.toDate()) : 'Recent'}
                  </p>
                </div>
                
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-4 italic leading-relaxed">
                  "{incident.description}"
                </p>
                
                <div className="flex items-center gap-2 mb-4 mt-auto">
                  <MapPin className="w-3 h-3 text-brand-accent shrink-0" />
                  <span className="text-[10px] text-slate-500 line-clamp-1 font-medium">{incident.address}</span>
                </div>

                <div className="pt-3 border-t border-cyan-900/20 flex gap-2">
                  {incident.userId === user?.uid ? (
                    <>
                      <Link 
                        to={`/edit/${incident.id}`}
                        className="flex-1 py-2 rounded bg-brand-accent/10 text-brand-accent text-[10px] font-bold hover:bg-brand-accent/20 transition-all text-center uppercase tracking-widest"
                      >
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(incident.id)}
                        className="flex-1 py-2 rounded bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest px-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        {incident.userName}
                      </div>
                      <span className="opacity-50">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
