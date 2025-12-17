import { useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

type Payment = {
  _id: string;
  taskId: {
    _id: string;
    title: string;
    companyName: string;
  };
  amount: number;
  status: "pending" | "escrowed" | "released";
  escrowedAt?: string;
  releasedAt?: string;
};

export default function PaymentsPage() {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    // Refresh user data when page loads to get latest gold
    refreshUser();
  }, []);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");
      // Get all tasks where student is accepted, then fetch payment for each
      const appsRes = await apiGet<{ success: boolean; data: any[] }>("/applications/me");
      if (appsRes.success) {
        const acceptedTasks = appsRes.data
          .filter((app: any) => app.status === "accepted" && app.internshipId)
          .map((app: any) => app.internshipId._id || app.internshipId);

        const paymentPromises = acceptedTasks.map((taskId: string) =>
          apiGet<{ success: boolean; data: Payment | null }>(`/payments/task/${taskId}`)
        );

        const paymentResults = await Promise.all(paymentPromises);
        const validPayments = paymentResults
          .filter((res) => res.success && res.data)
          .map((res) => res.data!);

        setPayments(validPayments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    return status === "released"
      ? "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]"
      : status === "escrowed"
      ? "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
      : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading payments…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">My Payments</h1>
        <p className="text-sm text-[#6b7280]">Track payments for your completed tasks</p>
      </div>

      {/* Gold & XP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Total Gold</div>
          <div className="text-3xl font-bold text-[#111827]">{(user as any)?.gold || 0}</div>
        </div>
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Total XP</div>
          <div className="text-3xl font-bold text-[#111827]">{(user as any)?.xp || 0}</div>
        </div>
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6">
          <div className="text-xs font-medium text-[#6b7280] uppercase tracking-wide mb-2">Total Earned</div>
          <div className="text-3xl font-bold text-[#111827]">
            ৳{payments
              .filter((p) => p.status === "released")
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString()}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <h3 className="text-lg font-semibold text-[#111827] mb-2">No Payments Yet</h3>
          <p className="text-sm text-[#6b7280]">
            Payments will appear here once employers fund escrow for your tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment._id}
              className="border border-[#e5e7eb] rounded-lg bg-white p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#111827] mb-2">{payment.taskId.title}</h3>
                  <p className="text-sm text-[#6b7280] mb-4">{payment.taskId.companyName}</p>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-[#111827]">
                      ৳{payment.amount.toLocaleString()}
                    </span>
                    {payment.escrowedAt && (
                      <span className="text-xs text-[#6b7280]">
                        Escrowed: {new Date(payment.escrowedAt).toLocaleDateString()}
                      </span>
                    )}
                    {payment.releasedAt && (
                      <span className="text-xs text-[#6b7280]">
                        Released: {new Date(payment.releasedAt).toLocaleDateString()}
                      </span>
                    )}
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

