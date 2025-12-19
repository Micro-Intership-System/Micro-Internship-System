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

  function renderStars(rating: number) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "12px",
              color: star <= rating ? "#fbbf24" : "rgba(255,255,255,0.3)",
            }}
          >
            ★
          </span>
        ))}
        <span style={{ marginLeft: "4px", fontSize: "11px", color: "var(--muted)" }}>
          ({rating.toFixed(1)})
        </span>
      </div>
    );
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
            <div className="browse-eyebrow">Student Management</div>
            <h1 className="browse-title">All Students</h1>
            <p className="browse-subtitle">
              Search and manage all students on the platform. View their profiles, performance metrics, and activity.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Total Students</div>
              <div className="browse-stat-value">{students.length}</div>
            </div>
          </div>
        </header>

        {/* Search */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-field">
            <label className="browse-label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or institution..."
              className="browse-input"
            />
          </div>
        </section>

        {/* Students Table */}
        <section className="browse-panel" style={{ marginTop: "16px" }}>
          <div className="browse-panel-head">
            <h2 className="browse-panel-title">Students</h2>
            <div className="browse-panel-subtitle">{filteredStudents.length} found</div>
          </div>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              {searchQuery ? "No students found matching your search" : "No students found"}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Student</th>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Rating</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Tasks</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Avg. Time</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Gold</th>
                    <th style={{ padding: "12px", textAlign: "center", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {student.profilePicture ? (
                            <img
                              src={student.profilePicture}
                              alt={student.name}
                              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "14px" }}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "14px" }}>{student.name}</div>
                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{student.email}</div>
                            {student.institution && (
                              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{student.institution}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        {renderStars(student.starRating || 1)}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {student.totalTasksCompleted || 0}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {student.averageCompletionTime && student.averageCompletionTime > 0 ? `${student.averageCompletionTime.toFixed(1)}d` : "—"}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", fontWeight: 800 }}>
                        {student.gold || 0}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className="browse-btn"
                          style={{
                            fontSize: "11px",
                            padding: "6px 12px",
                            background: "rgba(239,68,68,.8)",
                            border: "1px solid rgba(239,68,68,.5)",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ textAlign: "center", padding: "16px", fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)", marginTop: "12px" }}>
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </section>
      </div>
    </div>
  );
}
