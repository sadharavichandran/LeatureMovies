import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';

const updateTargetStats = async (targetId, targetType, req) => {
  if (targetType === 'Platform') {
    return null;
  }
  // We'll just handle Movie here as requested, or keep Theatre if needed later
  const Model = Movie; // Actually let's assume Movie for now, user only requested Movie.
  const reviews = await Review.find({ targetId });

  let totalRatings = 0;
  let totalReviews = reviews.length;
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(r => {
    totalRatings += r.rating;
    ratingDistribution[r.rating] += 1;
  });

  const averageRating = totalReviews > 0 ? (totalRatings / totalReviews) : 0;

  const target = await Model.update(
    targetId,
    { averageRating, totalRatings, totalReviews, ratingDistribution }
  );

  const io = req.app.get('io');
  if (io) {
    io.emit('review_updated', {
      targetId,
      targetType: 'Movie',
      stats: { averageRating, totalRatings, totalReviews, ratingDistribution }
    });
  }

  return target;
};

export const submitReview = async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const userId = req.user.id;
    
    // Fetch the full user to get their name
    const user = await User.findById(userId);
    const userName = user ? user.fullName : 'Anonymous User';

    const existingReview = await Review.findOne({ targetId, userId });
    
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
    } else {
      await Review.create({
        targetId,
        targetType,
        userId,
        userName,
        rating,
        comment
      });
    }

    await updateTargetStats(targetId, targetType, req);
    res.json({ success: true, message: "Review submitted successfully" });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user.id;

    await Review.findOneAndDelete({ targetId, userId });
    
    const targetType = 'Movie';
    await updateTargetStats(targetId, targetType, req);
    
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};

export const getTargetReviews = async (req, res) => {
  try {
    const { targetId } = req.params;
    const reviews = await Review.find({ targetId }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

export const getAllTheatreReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetType: 'Theatre' }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get theatre reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch theatre reviews" });
  }
};

export const getAllPlatformReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ targetType: 'Platform' }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get platform reviews error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch platform reviews" });
  }
};
