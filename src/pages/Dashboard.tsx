import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../lib/cloudinary';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, Send, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Accident');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleGetLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        // Reverse geocoding using OpenStreetMap Nominatim (No API key required for low volume)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        setLocation({
          lat: latitude,
          lng: longitude,
          address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
      } catch (err) {
        console.error("Geocoding error:", err);
        setLocation({
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
      } finally {
        setLocating(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      alert("Please enable location permissions");
      setLocating(false);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return alert("Please add incident location");
    if (!image) return alert("Please add an image of the incident");

    setLoading(true);
    try {
      // 1. Upload to Cloudinary
      const imageUrl = await uploadImage(image);

      // 2. Save to Firestore
      const incidentData = {
        title,
        description,
        category,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        imageUrl,
        userId: user?.uid,
        userName: user?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'incidents'), incidentData);
      navigate('/feed');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'incidents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-1/3 flex flex-col gap-6"
      >
        <div className="card-gradient p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-white">Hello, <span className="text-brand-accent font-semibold">{user?.displayName?.split(' ')[0] || 'Sentinel'}</span></h2>
            <p className="text-sm text-slate-400">Report a new incident to the network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-caps">Incident Title</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g. Traffic Collision at Main St"
              />
            </div>

            <div>
              <label className="label-caps">Category</label>
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
              <label className="label-caps">Description</label>
              <textarea 
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
                placeholder="Details of the event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={locating}
                className="btn-secondary"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Pin Location
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
            </div>

            <div className="bg-brand-bg p-3 rounded-lg border border-cyan-900/50">
              <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-tighter">Verified Address</p>
              <p className="text-xs text-slate-300 line-clamp-1">{location ? location.address : 'No location selected'}</p>
            </div>

            {imagePreview && (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-cyan-900/50">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Upload Incident Report'}
            </button>
          </form>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-400/20 rounded-2xl p-4 flex justify-around">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">My Reports</p>
            <p className="text-xl font-bold text-white">Active</p>
          </div>
          <div className="w-px h-10 bg-cyan-900/30"></div>
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">Status</p>
            <p className="text-xl font-bold text-brand-accent italic shrink-0">Live</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 hidden md:flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            Network Operations
            <span className="bg-brand-accent/10 text-brand-accent text-[10px] px-2 py-0.5 rounded-full uppercase font-bold animate-pulse">Online</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 h-full">
           <div className="card-gradient p-8 flex flex-col items-center justify-center text-center gap-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer group" onClick={() => navigate('/feed')}>
              <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-8 h-8 text-brand-accent" />
              </div>
              <h4 className="text-lg font-bold text-slate-100">Browse Recent Feed</h4>
              <p className="text-sm text-slate-500">View what other sentinels have reported in your area.</p>
           </div>
           <div className="card-gradient p-8 flex flex-col items-center justify-center text-center gap-4 opacity-60 grayscale">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-slate-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-500">Global Heatmap</h4>
              <p className="text-sm text-slate-600">Advanced analytics coming soon for verified sentinels.</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
