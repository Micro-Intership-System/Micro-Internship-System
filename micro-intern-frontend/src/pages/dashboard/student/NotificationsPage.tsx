import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../../api/client";
import "./NotificationsPage.css";

import "./NotificationsPage.css";




type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: {
    _id: string;
    title: string;
  };
  relatedUserId?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
};

function getNotificationIcon(type: string) {
  const icons: Record<string, string> = {
    application_received: "📥",
    application_accepted: "✅",
    application_rejected: "❌",
    task_assigned: "📋",
    task_completed: "🎉",
    payment_released: "💰",
    payment_received: "💵",
    message_received: "💬",
    anomaly_detected: "⚠️",
    milestone_reached: "🏆",
    review_received: "⭐",
  };
  return icons[type] || "🔔";
}

function getNotificationColor(type: string) {
  const colors: Record<string, string> = {
    application_received: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    application_accepted: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
    application_rejected: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    task_assigned: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
    task_completed: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
    payment_released: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
    payment_received: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]",
    message_received: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    anomaly_detected: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    milestone_reached: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
    review_received: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  };
  return colors[type] || "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;

  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<NotificationsResponse>("/notifications");
      if (res.success) {
        const filtered = filter === "unread" 
          ? res.data.filter(n => !n.isRead)
          : res.data;
        setNotifications(filtered);
        setUnreadCount(res.pagination.unreadCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await apiPatch(`/notifications/${notificationId}/read`, {});
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    try {
      await apiPatch("/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  const displayedNotifications = filter === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-[#6b7280]">Loading notifications…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">Notifications</h1>
          <p className="text-sm text-[#6b7280]">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-lg border border-[#d1d5db] text-[#111827] text-sm font-semibold hover:bg-[#f9fafb] transition-colors whitespace-nowrap"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[#fecaca] bg-[#fee2e2] rounded-lg px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#e5e7eb]">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "unread"
              ? "border-[#111827] text-[#111827]"
              : "border-transparent text-[#6b7280] hover:text-[#111827]"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length === 0 ? (
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-16 text-center">
          <p className="text-sm text-[#6b7280]">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`border rounded-lg p-4 transition-all ${
                notification.isRead
                  ? "border-[#e5e7eb] bg-white"
                  : "border-[#111827] bg-[#f9fafb]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className={`text-sm font-semibold ${notification.isRead ? "text-[#374151]" : "text-[#111827]"}`}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-xs text-[#6b7280] hover:text-[#111827] transition-colors flex-shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#6b7280] mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
                    <span>{timeAgo(notification.createdAt)}</span>
                    {notification.relatedTaskId && (
                      <Link
                        to={`/internships/${notification.relatedTaskId._id}`}
                        className="hover:text-[#111827] transition-colors"
                      >
                        View Task →
                      </Link>
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


