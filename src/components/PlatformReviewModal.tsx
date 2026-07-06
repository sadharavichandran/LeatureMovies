import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { reviewService } from '../services/api';

interface PlatformReviewModalProps {
  onClose: () => void;
}

export default function PlatformReviewModal({ onClose }: PlatformReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await reviewService.submitReview({
        targetId: 'App',
        targetType: 'Platform',
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-stone-950">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C5A059]" />
            <h2 className="text-xl font-serif font-bold text-stone-100">App Feedback</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <Star className="w-8 h-8 text-green-400 fill-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-stone-400 text-sm">Your feedback has been submitted to the admin team.</p>
            </div>
          ) : (
            <form id="platform-review-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2 items-center">
                <label className="text-xs font-mono uppercase text-stone-400">Rate your experience</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110 p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase text-stone-400 pl-1">Tell us more (Optional)</label>
                <textarea
                  rows={4}
                  placeholder="What do you like? What can we improve?"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-[#C5A059]/50 transition-colors resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-white/5 bg-stone-950 flex justify-end">
            <button
              type="submit"
              form="platform-review-form"
              disabled={loading}
              className={`px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] font-bold text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:opacity-90 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
