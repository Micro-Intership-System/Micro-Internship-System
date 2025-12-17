import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../../../api/client";

type Review = {
  _id: string;
  reviewerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
  reviewedId: {
    _id: string;
    name: string;
  };
  taskId: {
    _id: string;
    title: string;
  };
  starRating: number;
  comment?: string;
  reviewType: "employer_to_student" | "student_to_employer";
  createdAt: string;
};

export default function ViewReviewsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (studentId) loadReviews();
  }, [studentId]);

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{
        success: boolean;
        data: Review[];
        averageRating: number;
        totalReviews: number;
      }>(`/reviews/student/${studentId}`);
      if (res.success) {
        setReviews(res.data || []);
        setAverageRating(res.averageRating || 0);
        setTotalReviews(res.totalReviews || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-[#e5e7eb] fill-current"
            }`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading reviews…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Reviews</h1>
        <p className="text-sm text-[#6b7280]">View all reviews for this student</p>
      </div>

      {/* Summary */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-[#6b7280] mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-[#111827]">{averageRating.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-sm text-[#6b7280] mb-1">Total Reviews</div>
            <div className="text-3xl font-bold text-[#111827]">{totalReviews}</div>
          </div>
          <div className="flex-1">
            {renderStars(Math.round(averageRating))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Reviews Yet</h3>
          <p className="text-sm text-[#6b7280]">
            This student hasn't received any reviews yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white text-sm font-semibold">
                      {review.reviewerId.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#111827]">
                        {review.reviewerId.companyName || review.reviewerId.name}
                      </div>
                      <div className="text-xs text-[#6b7280]">{review.taskId.title}</div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-[#374151] mt-3">{review.comment}</p>
                  )}
                </div>
                <div className="text-right">
                  {renderStars(review.starRating)}
                  <div className="text-xs text-[#6b7280] mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

