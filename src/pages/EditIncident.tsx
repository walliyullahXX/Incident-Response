import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import { motion } from 'motion/react';
import { Save, ArrowLeft, Loader2, MapPin, AlertCircle } from 'lucide-react';

export default function EditIncident() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState<any>(null);

  useEffect(() => {
    const fetchIncident = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'incidents', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user?.uid) {
            alert("You are not authorized to edit this report.");
            navigate('/feed');
            return;
          }
          setIncident(data);
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
        } else {
          alert("Incident not found");
          navigate('/feed');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `incidents/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchIncident();
  }, [id, user?.uid, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'incidents', id);
      await updateDoc(docRef, {
        title,
        description,
        category,
        updatedAt: serverTimestamp(),
      });
      navigate('/feed');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `incidents/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-brand-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <button 
        onClick={() => navigate('/feed')}
        className="flex items-center gap-2 text-slate-500 hover:text-brand-accent mb-8 transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Feed
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-gradient p-10"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-brand-accent/10 rounded-xl flex items-center justify-center shrink-0 border border-brand-accent/20">
            <AlertCircle className="text-brand-accent w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-slate-100 italic uppercase tracking-tighter">Edit <span className="font-bold text-brand-accent">Report</span></h1>
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Operational Modification</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="aspect-video rounded-xl overflow-hidden mb-6 border border-cyan-900/40 relative">
            <img src={incident.imageUrl} alt="Incident" className="w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/80 to-transparent"></div>
          </div>

          <div className="bg-brand-bg p-4 rounded-xl border border-cyan-900/50 mb-6 flex items-start gap-4">
            <MapPin className="text-brand-accent w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Initial Sector</p>
              <p className="text-slate-300 mt-1 font-medium">{incident.address}</p>
            </div>
          </div>

          <div>
            <label className="label-caps">Incident Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Major Accident on Bridge"
            />
          </div>

          <div>
            <label className="label-caps">Status Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field appearance-none cursor-pointer"
            >
              <option value="Accident">Accident</option>
              <option value="Fighting">Fighting</option>
              <option value="Rioting">Rioting</option>
              <option value="Traffic">Traffic</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="label-caps">Operational Log (Description)</label>
            <textarea 
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none leading-relaxed transition-all"
              placeholder="Update logs..."
            />
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
              <Save className="w-4 h-4" />
              Commit Updates
            </>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
