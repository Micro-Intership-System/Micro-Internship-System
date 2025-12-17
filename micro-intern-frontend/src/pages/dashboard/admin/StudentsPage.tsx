import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../../api/client";

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
        // Ensure all students have default values for missing fields
        const studentsWithDefaults = (res.data || []).map((student) => ({
          ...student,
          starRating: student.starRating || 1,
          totalTasksCompleted: student.totalTasksCompleted || 0,
          averageCompletionTime: student.averageCompletionTime || 0,
          xp: student.xp || 0,
          gold: student.gold || 0,
        }));
        setStudents(studentsWithDefaults);
        console.log(`Loaded ${studentsWithDefaults.length} students`);
      } else {
        console.warn("No students data returned:", res);
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
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading students…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#111827] mb-3">Student Management</h1>
        <p className="text-sm text-[#6b7280] max-w-2xl mx-auto">
          Search and manage all students on the platform. View their profiles, performance metrics, and activity.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or institution..."
          className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
        />
      </div>

      {/* Students Table */}
      <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#374151] uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Tasks</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Avg. Time</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">XP</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Gold</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#374151] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6b7280]">
                    {searchQuery ? "No students found matching your search" : "No students found"}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#111827] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#111827]">{student.name}</div>
                          <div className="text-xs text-[#6b7280]">{student.email}</div>
                          {student.institution && (
                            <div className="text-xs text-[#9ca3af]">{student.institution}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (student.starRating || 1) ? "text-yellow-400 fill-current" : "text-[#e5e7eb] fill-current"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-[#374151]">({(student.starRating || 1).toFixed(1)})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">{student.totalTasksCompleted || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">
                        {student.averageCompletionTime && student.averageCompletionTime > 0 ? `${student.averageCompletionTime.toFixed(1)}d` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">{student.xp || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-[#111827]">{student.gold || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="px-3 py-1.5 rounded-lg bg-[#991b1b] text-white text-xs font-semibold hover:bg-[#7f1d1d] transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-sm text-[#6b7280]">
        Showing {filteredStudents.length} of {students.length} students
      </div>
    </div>
  );
}


