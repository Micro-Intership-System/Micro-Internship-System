import { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../../api/client";

type Employer = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  companyName?: string;
  companyDescription?: string;
  verificationStatus?: string;
  totalTasksPosted?: number;
  totalPaymentsMade?: number;
};

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEmployers();
  }, []);

  async function loadEmployers() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Employer[] }>("/employer/all");
      if (res.success) {
        setEmployers(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employers:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployers = employers.filter((employer) =>
    employer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employer.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDeleteEmployer(employerId: string) {
    if (!confirm("Are you sure you want to delete this employer? This will permanently delete the employer, all their jobs, and all related data.")) {
      return;
    }

    try {
      await apiDelete(`/admin/users/${employerId}`);
      alert("Employer deleted successfully");
      await loadEmployers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete employer");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading employers…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#111827] mb-3">Employer Management</h1>
        <p className="text-sm text-[#6b7280] max-w-2xl mx-auto">
          Search and manage all employers on the platform. View their companies, verification status, and activity.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
        />
      </div>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployers.length === 0 ? (
          <div className="col-span-full border border-[#e5e7eb] rounded-lg bg-white p-12 text-center">
            <p className="text-sm text-[#6b7280]">
              {searchQuery ? "No employers found matching your search" : "No employers found"}
            </p>
          </div>
        ) : (
          filteredEmployers.map((employer) => (
            <div
              key={employer._id}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#111827] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {employer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-[#111827] mb-1">{employer.name}</div>
                  <div className="text-sm text-[#6b7280] mb-2">{employer.email}</div>
                  {employer.companyName && (
                    <div className="text-sm font-medium text-[#111827] mb-1">{employer.companyName}</div>
                  )}
                  {employer.companyDescription && (
                    <p className="text-xs text-[#6b7280] line-clamp-2">{employer.companyDescription}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-[#e5e7eb]">
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-[#111827]">{employer.totalTasksPosted || 0}</div>
                  <div className="text-xs text-[#6b7280]">Tasks Posted</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-lg font-bold text-[#111827]">{employer.totalPaymentsMade || 0}</div>
                  <div className="text-xs text-[#6b7280]">Payments Made</div>
                </div>
                <div className="text-center flex-1">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    employer.verificationStatus === "verified"
                      ? "bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]"
                      : "bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
                  }`}>
                    {employer.verificationStatus || "Pending"}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-[#e5e7eb] mt-4">
                <button
                  onClick={() => handleDeleteEmployer(employer._id)}
                  className="w-full px-4 py-2 rounded-lg bg-[#991b1b] text-white text-sm font-semibold hover:bg-[#7f1d1d] transition-colors"
                >
                  Delete Employer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-center text-sm text-[#6b7280]">
        Showing {filteredEmployers.length} of {employers.length} employers
      </div>
    </div>
  );
}


