import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";

type Payment = {
  _id: string;
  taskId: {
    _id: string;
    title: string;
    gold: number;
    status: string;
    completedAt?: string;
  };
  employerId: {
    _id: string;
    name: string;
  };
  studentId: {
    _id: string;
    name: string;
  };
  amount: number;
  status: "pending" | "escrowed" | "released";
  escrowedAt?: string;
  releasedAt?: string;
};

export default function TaskPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadPayment();
  }, [id]);

  async function loadPayment() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<{ success: boolean; data: Payment | null }>(`/payments/task/${id}`);
      if (res.success) {
        setPayment(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }

  async function fundEscrow() {
    if (!id) return;
    try {
      setActionLoading(true);
      setError("");
      await apiPost("/payments/escrow", { taskId: id });
      await loadPayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fund escrow");
    } finally {
      setActionLoading(false);
    }
  }

  async function releasePayment() {
    if (!payment) return;
    try {
      setActionLoading(true);
      setError("");
      await apiPost(`/payments/release/${payment._id}`, {});
      await loadPayment();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release payment");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading payment information…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          to="/dashboard/employer/jobs"
          className="text-sm text-[#6b7280] hover:text-[#111827] mb-4 inline-block"
        >
          ← Back to Jobs
        </Link>
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Payment Management</h1>
        <p className="text-sm text-[#6b7280]">Manage escrow and payment release for this task</p>
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Payment Info */}
      {payment ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-6 space-y-6">
          {/* Task Info */}
          <div>
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Task Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Task Title:</span>
                <span className="font-medium text-[#111827]">{payment.taskId.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Gold:</span>
                <span className="font-medium text-[#111827]">{payment.amount.toLocaleString()} Gold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  payment.taskId.status === "completed" ? "bg-[#d1fae5] text-[#065f46]" :
                  payment.taskId.status === "in_progress" ? "bg-[#fef3c7] text-[#92400e]" :
                  "bg-[#dbeafe] text-[#1e40af]"
                }`}>
                  {payment.taskId.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Student:</span>
                <span className="font-medium text-[#111827]">{payment.studentId.name}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="border-t border-[#e5e7eb] pt-6">
            <h2 className="text-lg font-semibold text-[#111827] mb-4">Payment Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg">
                <div>
                  <div className="text-sm font-medium text-[#111827] mb-1">Current Status</div>
                  <div className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                    payment.status === "released" ? "bg-[#d1fae5] text-[#065f46]" :
                    payment.status === "escrowed" ? "bg-[#fef3c7] text-[#92400e]" :
                    "bg-[#fee2e2] text-[#991b1b]"
                  }`}>
                    {payment.status.toUpperCase()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#111827] mb-1">Amount</div>
                  <div className="text-lg font-bold text-[#111827]">৳{payment.amount.toLocaleString()}</div>
                </div>
              </div>

              {payment.escrowedAt && (
                <div className="text-xs text-[#6b7280]">
                  Escrowed on: {new Date(payment.escrowedAt).toLocaleString()}
                </div>
              )}

              {payment.releasedAt && (
                <div className="text-xs text-[#6b7280]">
                  Released on: {new Date(payment.releasedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-[#e5e7eb] pt-6">
            {payment.status === "pending" && payment.taskId.status === "in_progress" && (
              <button
                onClick={fundEscrow}
                disabled={actionLoading}
                className="w-full px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : `Fund Escrow (৳${payment.amount.toLocaleString()})`}
              </button>
            )}

            {payment.status === "escrowed" && payment.taskId.status === "completed" && (
              <button
                onClick={releasePayment}
                disabled={actionLoading}
                className="w-full px-6 py-3 rounded-lg bg-[#111827] text-white text-sm font-semibold hover:bg-[#1f2937] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Processing..." : `Release Payment (৳${payment.amount.toLocaleString()})`}
              </button>
            )}

            {payment.status === "escrowed" && payment.taskId.status !== "completed" && (
              <div className="p-4 bg-[#fef3c7] rounded-lg text-sm text-[#92400e]">
                Payment is escrowed. Release will be available once the task is marked as completed.
              </div>
            )}

            {payment.status === "released" && (
              <div className="p-4 bg-[#d1fae5] rounded-lg text-sm text-[#065f46]">
                Payment has been released to the student. Gold and XP have been awarded.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-12 text-center">
          <p className="text-sm text-[#6b7280] mb-4">No payment record found for this task.</p>
          <p className="text-xs text-[#9ca3af]">
            Payment will be created when you fund the escrow for an in-progress task.
          </p>
        </div>
      )}
    </div>
  );
}

