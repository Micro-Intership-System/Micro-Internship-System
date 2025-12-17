import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

type Certificate = {
  certificateId: string;
  student: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    description?: string;
  };
  completedAt: string;
  valid: boolean;
};

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");
      // Get enrolled courses and check for certificates
      const coursesRes = await apiGet<{ success: boolean; data: any[] }>("/shop/my-courses");
      if (coursesRes.success) {
        const completedCourses = coursesRes.data.filter(
          (course: any) => course.completedAt
        );

        // For each completed course, try to get certificate
        const certPromises = completedCourses.map((course: any) =>
          apiGet<{ success: boolean; data: Certificate }>(
            `/certificates/${course.certificateId || course._id}`
          ).catch(() => null)
        );

        const certResults = await Promise.all(certPromises);
        const validCerts = certResults
          .filter((res) => res && res.success && res.data)
          .map((res) => res!.data);

        setCertificates(validCerts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  }

  function downloadCertificate(certificateId: string) {
    // Open certificate HTML in new window
    window.open(`/api/certificates/${certificateId}/html`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading certificates…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">My Certificates</h1>
        <p className="text-sm text-[#6b7280]">View and download your course completion certificates</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Certificates Yet</h3>
          <p className="text-sm text-[#6b7280] mb-6">
            Complete courses to earn certificates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.certificateId}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">
                  {cert.course.title}
                </h3>
                {cert.course.description && (
                  <p className="text-sm text-[#6b7280] line-clamp-2">{cert.course.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Completed:</span>
                  <span className="font-medium text-[#111827]">
                    {new Date(cert.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">Status:</span>
                  <span
                    className={`font-medium ${
                      cert.valid ? "text-[#065f46]" : "text-[#991b1b]"
                    }`}
                  >
                    {cert.valid ? "Valid" : "Invalid"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => downloadCertificate(cert.certificateId)}
                className="w-full px-4 py-2 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors"
              >
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

