import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Student = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  starRating?: number;
  totalTasksCompleted?: number;
  averageCompletionTime?: number;
  xp?: number;
  gold?: number;
  skills?: string[];
  institution?: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Student[] }>("/student/all");
      if (res.success && res.data) {
        const studentsWithDefaults = (res.data || []).map((student) => ({
          ...student,
          starRating: student.starRating || 1,
          totalTasksCompleted: student.totalTasksCompleted || 0,
          averageCompletionTime: student.averageCompletionTime || 0,
          xp: student.xp || 0,
          gold: student.gold || 0,
        }));
        setStudents(studentsWithDefaults);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.institution?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDeleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student? This will permanently delete the student and all related data (applications, etc.).")) {
      return;
    }

    try {
      await apiDelete(`/admin/users/${studentId}`);
      alert("Student deleted successfully");
      await loadStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student");
    }
  }

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading students…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-page">
      <div className="browse-inner">
        {/* Header */}
        <header className="browse-header">
          <div className="browse-title-wrap">
            <div className="browse-eyebrow">Admin</div>
            <h1 className="browse-title">Student Management</h1>
            <p className="browse-subtitle">Search and manage all students on the platform</p>
          </div>
        </header>

        {/* Search */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or institution..."
            className="browse-input"
            style={{ width: "100%", maxWidth: "500px" }}
          />
        </section>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">
                {searchQuery ? "No students found matching your search" : "No students found"}
              </div>
            </div>
          </section>
        ) : (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-results-head">
              <h2 className="browse-results-title">Students</h2>
              <div className="browse-results-count">{filteredStudents.length} found</div>
            </div>
            <div className="browse-cards">
              {filteredStudents.map((student) => (
                <article key={student._id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-card-main">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {student.profilePicture ? (
                          <img
                            src={student.profilePicture}
                            alt={student.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "18px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="job-title" style={{ marginBottom: "4px" }}>
                            {student.name}
                          </div>
                          <div className="job-sub">{student.email}</div>
                          {student.institution && (
                            <div className="job-sub" style={{ fontSize: "12px", marginTop: "4px" }}>
                              {student.institution}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              width="14"
                              height="14"
                              viewBox="0 0 20 20"
                              fill={star <= Math.round(student.starRating || 1) ? "rgba(251,191,36,.9)" : "rgba(255,255,255,.2)"}
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "4px" }}>
                            {(student.starRating || 1).toFixed(1)}
                          </span>
                        </div>
                        <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                          {student.totalTasksCompleted || 0} tasks
                        </span>
                        <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                          {student.gold || 0} gold
                        </span>
                        {student.averageCompletionTime && student.averageCompletionTime > 0 && (
                          <span className="badge" style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
                            {student.averageCompletionTime.toFixed(1)}d avg
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="browse-btn browse-btn--danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--muted)" }}>
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>
    </div>
  );
}
