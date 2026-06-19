import React, { useState } from 'react';
import { X, Search, Camera } from 'lucide-react';
import { Theatre, UserProfile } from '../types';

interface ReportLostFoundModalProps {
  theatre: Theatre;
  currentUser: UserProfile;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function ReportLostFoundModal({
  theatre,
  currentUser,
  onClose,
  onSubmit
}: ReportLostFoundModalProps) {
  const [type, setType] = useState<'Lost' | 'Found'>('Lost');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`
  );
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple file to base64 reader
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        userId: currentUser.id,
        userName: currentUser.fullName,
        userEmail: currentUser.email,
        theatreId: theatre.id,
        theatreName: theatre.name,
        type,
        itemName,
        description,
        location,
        date,
        time,
        imageUrl,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-stone-950">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-100">Report Lost/Found Item</h2>
            <p className="text-xs text-stone-400 mt-1">at {theatre.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="lost-found-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Type Toggle */}
            <div className="flex bg-stone-900 rounded-xl p-1 border border-stone-800">
              <button
                type="button"
                onClick={() => setType('Lost')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'Lost'
                    ? 'bg-[#C5A059] text-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                  }`}
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => setType('Found')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'Found'
                    ? 'bg-[#C5A059] text-black shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                  }`}
              >
                I Found Something
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-stone-400 pl-1">Item Name</label>
              <input
                required
                type="text"
                placeholder={type === 'Lost' ? "e.g., Black Leather Wallet" : "e.g., iPhone 13 Pro"}
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-stone-400 pl-1">Description</label>
              <textarea
                required
                rows={3}
                placeholder="Brand, color, identifiable marks, etc."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C5A059]/50 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono uppercase text-stone-400 pl-1">
                {type === 'Lost' ? "Where did you last see it?" : "Where did you find it?"}
              </label>
              <input
                required
                type="text"
                placeholder="e.g., Seat G12, Restroom, Food Counter"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase text-stone-400 pl-1">Date</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase text-stone-400 pl-1">Time</label>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2 border border-dashed border-stone-800 rounded-xl p-4 items-center justify-center relative overflow-hidden bg-stone-950/50 hover:bg-stone-900 transition-colors group cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {imageUrl ? (
                <img src={imageUrl} alt="Item Preview" className="h-32 object-contain" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-stone-600 group-hover:text-[#C5A059] transition-colors mb-2" />
                  <p className="text-sm font-bold text-stone-400">Attach an Image (Optional)</p>
                  <p className="text-[10px] text-stone-600 font-mono">PNG, JPG, or GIF up to 5MB</p>
                </>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-stone-950 flex justify-end">
          <button
            type="submit"
            form="lost-found-form"
            disabled={loading}
            className={`px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>

      </div>
    </div>
  );
}
