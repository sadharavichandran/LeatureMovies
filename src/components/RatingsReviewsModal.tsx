import React, { useState, useEffect } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { Movie, Review, UserProfile } from "../types";
import { reviewService } from "../services/api";

interface RatingsReviewsModalProps {
  movie: Movie;
  currentUser: UserProfile | null;
  onClose: () => void;
  onLoginRequest: () => void;
}

export default function RatingsReviewsModal({
  movie,
  currentUser,
  onClose,
  onLoginRequest,
}: RatingsReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // User form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [movie.id]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getTargetReviews(movie.id);
      if (res.success) {
        setReviews(res.reviews || []);
        
        // Populate existing user review if present
        if (currentUser) {
          const existing = res.reviews?.find((r: Review) => r.userId === currentUser.id);
          if (existing) {
            setRating(existing.rating);
            setComment(existing.comment || "");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setSubmitting(true);
      await reviewService.submitReview({
        targetId: movie.id,
        targetType: "Movie",
        rating,
        comment,
      });
      // The socket event will trigger a global update, but we should also refetch local reviews
      await fetchReviews();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to submit review", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !window.confirm("Are you sure you want to delete your review?")) return;
    try {
      setSubmitting(true);
      await reviewService.deleteReview(movie.id);
      setRating(5);
      setComment("");
      await fetchReviews();
    } catch (err) {
      console.error("Failed to delete review", err);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = movie.averageRating || 0;
  const total = movie.totalReviews || 0;
  const dist = movie.ratingDistribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };

  const existingUserReview = currentUser ? reviews.find(r => r.userId === currentUser.id) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-stone-950 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-start justify-between bg-stone-900/40">
          <div className="flex gap-4 items-center">
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded-lg shadow-lg border border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 tracking-tight leading-tight">
                {movie.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#C5A059] border border-[#C5A059]/30 bg-[#C5A059]/10 px-2 py-0.5 rounded-full">
                  {movie.language}
                </span>
                <span className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-stone-400 border border-stone-700 bg-stone-800/50 px-2 py-0.5 rounded-full">
                  {movie.genre}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center justify-center p-6 bg-stone-900/50 rounded-xl border border-white/5">
              <div className="text-4xl font-bold text-stone-100 mb-1 flex items-center gap-1">
                <Star className="w-6 h-6 text-[#C5A059] fill-[#C5A059]" />
                {avgRating.toFixed(1)}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                {total} {total === 1 ? 'Rating' : 'Ratings'}
              </div>
            </div>
            
            <div className="sm:col-span-2 flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = dist[stars.toString()] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1 w-8 justify-end text-stone-300">
                      {stars} <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                    </div>
                    <div className="flex-1 h-2 bg-stone-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#C5A059] rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-stone-500 text-right">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review Action */}
          <div className="mb-8 border-b border-white/5 pb-8">
            {!currentUser ? (
              <div className="bg-stone-900/30 border border-stone-800 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                <MessageSquare className="w-8 h-8 text-stone-600 mb-3" />
                <h3 className="text-stone-200 font-bold mb-1">Have you seen this movie?</h3>
                <p className="text-xs text-stone-400 mb-4 max-w-sm">
                  Log in to share your thoughts and help others decide if it's worth watching.
                </p>
                <button
                  onClick={onLoginRequest}
                  className="px-6 py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow-lg"
                >
                  Log in to Rate
                </button>
              </div>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="bg-stone-900/50 border border-stone-800 rounded-xl p-5 flex flex-col gap-4 animate-fadeIn">
                <h3 className="font-bold text-stone-200">
                  {existingUserReview ? "Edit your review" : "Rate this movie"}
                </h3>
                
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

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                    Your Review (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you think of the movie?"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-sm text-stone-200 outline-none focus:border-[#C5A059]/50 transition-colors resize-none h-24"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {existingUserReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mr-auto"
                    >
                      Delete Review
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-400 hover:bg-stone-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow-lg"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between bg-stone-900/30 border border-stone-800 rounded-xl p-5">
                <div>
                  <h3 className="font-bold text-stone-200">
                    {existingUserReview ? "Your Review" : "Rate this movie"}
                  </h3>
                  {existingUserReview ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-[#C5A059] fill-[#C5A059]" />
                      <span className="text-xs font-bold text-stone-300">{existingUserReview.rating}.0</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 mt-1">Share your experience with other users</p>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2 border border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/10 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                >
                  {existingUserReview ? "Edit" : "Write Review"}
                </button>
              </div>
            )}
          </div>

          {/* All Reviews List */}
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-200 mb-4 flex items-center gap-2">
              User Reviews 
              <span className="text-xs font-mono text-stone-500 font-normal">({total})</span>
            </h3>

            {loading ? (
              <div className="text-center py-10 text-stone-500 text-sm">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-stone-800 rounded-xl text-stone-500 text-sm">
                No reviews yet. Be the first to rate!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-stone-900/20 border border-stone-800/60 rounded-xl p-4 transition-colors hover:border-stone-700/60">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center font-bold text-stone-300 text-xs shadow-inner">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-stone-200 block">{review.userName}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= review.rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-stone-800'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-stone-300 leading-relaxed mt-3 bg-stone-950/40 p-3 rounded-lg border border-white/5">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
