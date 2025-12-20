import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { apiGet } from "../../../api/client";
import "./css/StudentPortfolioPage.css";

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
      <div className="portfolio-page">
        <div className="portfolio-inner">
          <div className="portfolio-state">Loading portfolio…</div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-inner">
          <div className="portfolio-state">Portfolio not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-inner">

        {/* Header */}
        <div className="portfolio-header">
          <h1 className="portfolio-title">
            {readonly ? "Student Portfolio" : "My Portfolio"}
          </h1>
          <p className="portfolio-subtitle">
            {readonly
              ? "View student profile and achievements"
              : "Showcase your skills, experience, and accomplishments"}
          </p>
        </div>

        {/* Profile Card */}
        <div className="portfolio-card">
          <div className="profile-row">
            <div className="profile-avatar">
              {portfolioData.profilePicture ? (
                <img src={portfolioData.profilePicture} alt={portfolioData.name} />
              ) : (
                <div className="profile-avatar-fallback">
                  {portfolioData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-main">
              <h2 className="profile-name">{portfolioData.name}</h2>

              {portfolioData.institution && (
                <p className="profile-institution">{portfolioData.institution}</p>
              )}

              {portfolioData.bio && (
                <p className="profile-bio">{portfolioData.bio}</p>
              )}

              <div className="profile-stats">
                <div className="stat-box">
                  <div className="stat-label">Tasks Completed</div>
                  <div className="stat-value">{portfolioData.totalTasksCompleted || 0}</div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">Gold</div>
                  <div className="stat-value">{portfolioData.gold || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {portfolioData.skills && portfolioData.skills.length > 0 && (
          <div className="portfolio-card">
            <h3 className="section-title">Skills</h3>
            <div className="skills-wrap">
              {portfolioData.skills.map((skill: string, index: number) => (
                <span key={index} className="skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {!readonly && (
          <div className="portfolio-card">
            <h3 className="section-title">Contact</h3>
            <div className="contact-email">{portfolioData.email}</div>
          </div>
        )}

      </div>
    </div>
  );

}
