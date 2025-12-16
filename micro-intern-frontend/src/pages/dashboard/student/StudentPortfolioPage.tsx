import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet } from "../../../api/client";

type Props = {
  readonly?: boolean;
  studentId?: string;
};

export default function StudentPortfolioPage({
  readonly = false,
  studentId,
}: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  const displayStudentId = studentId || user?.id;

  useEffect(() => {
    if (displayStudentId) {
      loadPortfolio();
    }
  }, [displayStudentId]);

  async function loadPortfolio() {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when available
      // const res = await apiGet(`/student/${displayStudentId}/portfolio`);
      // setPortfolioData(res.data);
      
      // For now, use user data
      setPortfolioData({
        name: user?.name || "Student",
        email: user?.email || "",
        institution: (user as any)?.institution || "",
        skills: (user as any)?.skills || [],
        bio: (user as any)?.bio || "",
        profilePicture: (user as any)?.profilePicture || "",
        starRating: (user as any)?.starRating || 1,
        totalTasksCompleted: (user as any)?.totalTasksCompleted || 0,
        gold: (user as any)?.gold || 0,
        xp: (user as any)?.xp || 0,
      });
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? "text-yellow-400" : "text-slate-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading portfolio…</div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-sm text-slate-600">Portfolio not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {readonly ? "Student Portfolio" : "My Portfolio"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {readonly
              ? "View student profile and achievements"
              : "Showcase your skills, experience, and accomplishments"}
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-6">
          {portfolioData.profilePicture ? (
            <img
              src={portfolioData.profilePicture}
              alt={portfolioData.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-semibold text-slate-600">
              {portfolioData.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {portfolioData.name}
              </h2>
              {portfolioData.institution && (
                <p className="text-sm text-slate-600">{portfolioData.institution}</p>
              )}
            </div>

            {portfolioData.bio && (
              <p className="text-sm text-slate-700">{portfolioData.bio}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div>
                <div className="text-xs text-slate-500">Star Rating</div>
                <div className="mt-1">{renderStars(portfolioData.starRating || 1)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tasks Completed</div>
                <div className="text-lg font-semibold text-slate-900">
                  {portfolioData.totalTasksCompleted || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Gold</div>
                <div className="text-lg font-semibold text-slate-900">
                  {portfolioData.gold || 0} 🪙
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">XP</div>
                <div className="text-lg font-semibold text-slate-900">
                  {portfolioData.xp || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {portfolioData.skills && portfolioData.skills.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {portfolioData.skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {!readonly && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact</h3>
          <p className="text-sm text-slate-600">{portfolioData.email}</p>
        </div>
      )}
    </div>
  );
}

