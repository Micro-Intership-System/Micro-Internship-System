import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  employerId: {
    _id: string;
    name: string;
    companyName?: string;
  };
};

export default function SubmitReviewPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [starRating, setStarRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  async function loadTask() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Task }>(`/internships/${taskId}`);
      if (res.success) {
        setTask(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!taskId || starRating === 0) {
      setError("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await apiPost("/reviews", {
        taskId,
        starRating,
        comment: comment.trim() || undefined,
      });
      navigate("/dashboard/student/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading task information…</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Task not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Submit Review</h1>
        <p className="text-sm text-[#6b7280]">Share your experience with this employer</p>
      </div>

      {/* Task Info */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Task Information</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-[#6b7280]">Task:</span>
            <span className="ml-2 font-medium text-[#111827]">{task.title}</span>
          </div>
          <div>
            <span className="text-[#6b7280]">Employer:</span>
            <span className="ml-2 font-medium text-[#111827]">
              {task.employerId.companyName || task.employerId.name}
            </span>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
            {error}
          </div>
        )}

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-3">
            Rating <span className="text-[#ef4444]">*</span>
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setStarRating(star)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-8 h-8 ${
                    star <= starRating
                      ? "text-yellow-400 fill-current"
                      : "text-[#e5e7eb] fill-current"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              </button>
            ))}
          </div>
          {starRating > 0 && (
            <p className="text-xs text-[#6b7280] mt-2">
              {starRating === 5
                ? "Excellent"
                : starRating === 4
                ? "Very Good"
                : starRating === 3
                ? "Good"
                : starRating === 2
                ? "Fair"
                : "Poor"}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-[#111827] mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this employer..."
            rows={6}
            className="w-full px-4 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            onClick={submitReview}
            disabled={starRating === 0 || submitting}
            className="px-6 py-2.5 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
          <button
            onClick={() => navigate("/dashboard/student/applications")}
            className="px-6 py-2.5 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

