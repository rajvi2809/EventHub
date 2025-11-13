import React, { useState, useEffect, useCallback } from "react";
import { reviewsAPI, bookingsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";

const Reviews = ({ eventId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [distribution, setDistribution] = useState([]);
  const [sort, setSort] = useState("newest");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewsAPI.getEventReviews(eventId, { sort });
      setReviews(response.data.reviews);
      setDistribution(response.data.ratingDistribution);

      // Find user's review if they're authenticated
      if (isAuthenticated && user) {
        const userReview = response.data.reviews.find(
          (r) => r.user._id === user._id
        );
        if (userReview) {
          setUserReview(userReview);
          setRating(userReview.rating);
          setComment(userReview.comment);
          setTitle(userReview.title || "");
        }
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [eventId, sort, isAuthenticated, user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Need to provide bookingId (user must have a confirmed booking for this event)
      const bookingsRes = await bookingsAPI.getUserBookings();
      const myBooking = (bookingsRes.data.bookings || []).find(
        (b) => b.event?._id === eventId && b.status === "confirmed"
      );
      if (!myBooking) {
        setError(
          "You must have a confirmed booking for this event to submit a review"
        );
        return;
      }

      const reviewData = {
        eventId,
        bookingId: myBooking._id,
        rating,
        comment,
        title,
        aspects: {
          organization: rating,
          venue: rating,
          content: rating,
          value: rating,
        },
      };

      if (userReview) {
        await reviewsAPI.updateReview(userReview._id, reviewData);
      } else {
        await reviewsAPI.createReview(reviewData);
      }

      await loadReviews();
      setError("");
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err.response?.data?.message || "Failed to submit review");
    }
  };

  const handleVote = async (reviewId, helpful) => {
    try {
      await reviewsAPI.voteReview(reviewId, { helpful });
      await loadReviews();
    } catch (err) {
      console.error("Error voting on review:", err);
    }
  };

  const handleReport = async (reviewId) => {
    try {
      await reviewsAPI.reportReview(reviewId, { reason: "inappropriate" });
      await loadReviews();
    } catch (err) {
      console.error("Error reporting review:", err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Reviews</h2>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {reviews.length > 0
                ? (
                    reviews.reduce((sum, r) => sum + r.rating, 0) /
                    reviews.length
                  ).toFixed(1)
                : "No"}
              <span className="text-xl font-normal text-gray-600 ml-2">
                out of 5
              </span>
            </div>
            <div className="text-gray-600 mb-4">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count =
                distribution.find((d) => d._id === stars)?.count || 0;
              const percentage = reviews.length
                ? (count / reviews.length) * 100
                : 0;

              return (
                <div key={stars} className="flex items-center">
                  <div className="text-sm text-gray-600 w-8">{stars}</div>
                  <div className="mx-2 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 w-8">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Form - Only show for attendees, not organizers or admins */}
      {isAuthenticated && user?.role === "attendee" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-6 shadow-sm mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {userReview ? "Update Your Review" : "Write a Review"}
          </h3>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="text-yellow-400 focus:outline-none"
                  onClick={() => setRating(star)}
                >
                  {star <= rating ? (
                    <StarIcon className="h-8 w-8" />
                  ) : (
                    <StarOutlineIcon className="h-8 w-8" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              rows={4}
              placeholder="Share your experience with other attendees"
              required
              maxLength={1000}
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {userReview ? "Update Review" : "Submit Review"}
          </button>
        </form>
      )}

      {/* Sort Options */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  {review.user.avatar ? (
                    <img
                      src={review.user.avatar}
                      alt={review.user.firstName}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {review.user.firstName} {review.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <StarIcon
                    key={index}
                    className={`h-5 w-5 ${
                      index < review.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {review.title && (
              <h4 className="font-medium text-gray-900 mt-4">{review.title}</h4>
            )}

            <p className="text-gray-600 mt-2">{review.comment}</p>

            {/* Actions */}
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <button
                onClick={() => handleVote(review._id, true)}
                className="text-gray-500 hover:text-gray-700"
              >
                Helpful ({review.helpfulVotes})
              </button>
              <button
                onClick={() => handleReport(review._id)}
                className="text-gray-500 hover:text-gray-700"
              >
                Report
              </button>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
