import React, { useState } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { Theatre, UserProfile } from "../types";
import { reviewService } from "../services/api";

interface TheatreFeedbackModalProps {
  theatre: Theatre;
  currentUser: UserProfile;
  onClose: () => void;
}

export default function TheatreFeedbackModal({
  theatre,
  currentUser,
  onClose,
}: TheatreFeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await reviewService.submitReview({
        targetId: theatre.id,
        targetType: "Theatre",
        rating,
        comment,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-stone-950 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-stone-900/40 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-100 mb-1">
              {theatre.name} Feedback
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Share your experience with the administration.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#C5A059]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/40">
                <MessageSquare className="w-8 h-8 text-[#C5A059]" />
              </div>
              <h3 className="text-lg font-bold text-stone-100 mb-2">Thank you for your feedback!</h3>
              <p className="text-sm text-stone-400">
                Your review has been sent directly to the theatre administration team.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-stone-200 rounded-lg text-sm font-bold transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                  Rate your experience
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`w-8 h-8 ${rating >= star ? 'text-[#C5A059] fill-[#C5A059]' : 'text-stone-700'}`} 
                      />
                    </button>
                  ))}
                  <span className="ml-3 font-mono text-xl font-bold text-[#C5A059]">
                    {rating}.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                  Your Suggestions / Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell the admin how your experience was..."
                  className="w-full bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-sm text-stone-200 outline-none focus:border-[#C5A059]/50 transition-colors resize-none h-32"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-stone-400 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow-lg"
                >
                  {submitting ? "Sending..." : "Submit to Admin"}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
