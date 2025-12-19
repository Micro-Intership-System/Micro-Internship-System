import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../../api/client";
import "./css/NotificationsPage.css";

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

/**
 * Return a semantic "variant" class that the CSS can style.
 * This avoids Tailwind-like inline class strings.
 */
function getNotificationVariant(type: string) {
  switch (type) {
    case "application_received":
    case "message_received":
      return "info";
    case "application_accepted":
    case "task_completed":
    case "payment_released":
    case "payment_received":
      return "success";
    case "application_rejected":
    case "anomaly_detected":
      return "danger";
    case "task_assigned":
    case "milestone_reached":
    case "review_received":
      return "warning";
    default:
      return "neutral";
  }
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
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet<NotificationsResponse>("/notifications");
      if (res.success) {
        const filtered =
          filter === "unread" ? res.data.filter((n) => !n.isRead) : res.data;
        setNotifications(filtered);
        setUnreadCount(res.pagination.unreadCount);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await apiPatch(`/notifications/${notificationId}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllAsRead() {
    try {
      await apiPatch("/notifications/read-all", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }

  const displayedNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-loading-wrap">
        <div className="notifications-loading">Loading notifications…</div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          <h1 className="notifications-title">Notifications</h1>
          <p className="notifications-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount !== 1 ? "s" : ""
                }`
              : "All caught up!"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn btn-outline"
            type="button"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Error */}
      {error && <div className="notifications-error">{error}</div>}

      {/* Filter Tabs */}
      <div className="notifications-tabs">
        <button
          onClick={() => setFilter("all")}
          className={`notifications-tab ${filter === "all" ? "active" : ""}`}
          type="button"
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`notifications-tab ${filter === "unread" ? "active" : ""}`}
          type="button"
        >
          Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
      </div>

      {/* Notifications List */}
      {displayedNotifications.length === 0 ? (
        <div className="notifications-empty-card">
          <p className="notifications-empty-text">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="notifications-list">
          {displayedNotifications.map((notification) => {
            const variant = getNotificationVariant(notification.type);
            return (
              <div
                key={notification._id}
                className={`notification-card ${
                  notification.isRead ? "read" : "unread"
                }`}
              >
                <div className={`notification-icon ${variant}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-top">
                    <h3 className="notification-title">{notification.title}</h3>

                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="notification-mark-read"
                        type="button"
                      >
                        Mark read
                      </button>
                    )}
                  </div>

                  <p className="notification-message">{notification.message}</p>

                  <div className="notification-meta">
                    <span className="notification-time">
                      {timeAgo(notification.createdAt)}
                    </span>

                    {notification.relatedTaskId && (
                      <Link
                        to={`/internships/${notification.relatedTaskId._id}`}
                        className="notification-link"
                      >
                        View Task →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
