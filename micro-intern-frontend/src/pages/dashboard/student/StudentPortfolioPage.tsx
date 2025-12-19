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
        averageCompletionTime: (user as any)?.averageCompletionTime || 0,
      });
    } catch (err) {
      console.error("Failed to load portfolio:", err);
    } finally {
      setLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading portfolio…</div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Portfolio not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">
          {readonly ? "Student Portfolio" : "My Portfolio"}
        </h1>
        <p className="text-sm text-[#6b7280]">
          {readonly
            ? "View student profile and achievements"
            : "Showcase your skills, experience, and accomplishments"}
        </p>
      </div>

      {/* Profile Card */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
        <div className="flex items-start gap-6">
          {portfolioData.profilePicture ? (
            <img
              src={portfolioData.profilePicture}
              alt={portfolioData.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#111827] flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
              {portfolioData.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#111827] mb-1">
                {portfolioData.name}
              </h2>
              {portfolioData.institution && (
                <p className="text-sm text-[#6b7280]">{portfolioData.institution}</p>
              )}
            </div>

            {portfolioData.bio && (
              <p className="text-sm text-[#374151] leading-relaxed">{portfolioData.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#e5e7eb]">
              <div>
                <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Tasks Completed</div>
                <div className="text-lg font-bold text-[#111827]">
                  {portfolioData.totalTasksCompleted || 0}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Gold</div>
                <div className="text-lg font-bold text-[#111827]">
                  {portfolioData.gold || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {portfolioData.skills && portfolioData.skills.length > 0 && (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {portfolioData.skills.map((skill: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 rounded-full bg-[#f9fafb] text-xs text-[#374151] border border-[#e5e7eb]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {!readonly && (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <h3 className="text-lg font-semibold text-[#111827] mb-4">Contact</h3>
          <p className="text-sm text-[#6b7280]">{portfolioData.email}</p>
        </div>
      )}
    </div>
  );
}
