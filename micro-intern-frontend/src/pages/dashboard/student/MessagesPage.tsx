import { useEffect, useState, useRef } from "react";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
import "./css/BrowsePage.css";

type TaskChatMessage = {
  _id: string;
  taskId: {
    _id: string;
    title: string;
    companyName: string;
  };
  senderId: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  text: string;
  attachments?: string[];
  createdAt: string;
  status: "active" | "deleted" | "moderated";
};

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  acceptedStudentId?: string;
  completionDate?: string;
};

type PreviousTask = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  completionDate?: string;
};

type CompanyGroup = {
  companyName: string;
  tasks: PreviousTask[];
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [previousTasks, setPreviousTasks] = useState<PreviousTask[]>([]);
  const [companyGroups, setCompanyGroups] = useState<CompanyGroup[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TaskChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
    loadPreviousTasks();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      loadMessages(selectedTaskId);
      const interval = setInterval(() => {
        loadMessages(selectedTaskId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: any[] }>("/jobs/running");
      if (res.success) {
        const runningTasks = res.data.map((job: any) => ({
          _id: job._id,
          title: job.title,
          companyName: job.companyName,
          status: job.status,
          acceptedStudentId: user?.id,
        }));
        setTasks(runningTasks);
        
        const urlParams = new URLSearchParams(window.location.search);
        const taskIdParam = urlParams.get("taskId");
        
        if (taskIdParam && runningTasks.find((t: any) => t._id === taskIdParam)) {
          setSelectedTaskId(taskIdParam);
        } else if (runningTasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(runningTasks[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPreviousTasks() {
    try {
      // Fetch all applications to get completed tasks
      const appsRes = await apiGet<{ success: boolean; data: any[] }>("/applications/me");
      if (appsRes.success) {
        const acceptedApps = appsRes.data.filter((app: any) => app.status === "accepted");
        
        // Fetch task details for accepted applications
        const previousTasksList: PreviousTask[] = [];
        for (const app of acceptedApps) {
          if (app.internshipId) {
            const task = app.internshipId;
            // Include completed, cancelled, or any non-running tasks
            if (task.status === "completed" || task.status === "cancelled" || (task.status !== "in_progress" && task.status !== "posted")) {
              previousTasksList.push({
                _id: task._id,
                title: task.title,
                companyName: task.companyName,
                status: task.status,
                completionDate: task.completionDate,
              });
            }
          }
        }

        setPreviousTasks(previousTasksList);

        // Group by company name
        const grouped = previousTasksList.reduce((acc, task) => {
          const companyName = task.companyName || "Unknown Company";
          if (!acc[companyName]) {
            acc[companyName] = [];
          }
          acc[companyName].push(task);
          return acc;
        }, {} as Record<string, PreviousTask[]>);

        const groups: CompanyGroup[] = Object.entries(grouped)
          .map(([companyName, tasks]) => ({
            companyName,
            tasks: tasks.sort((a, b) => {
              // Sort by completion date (most recent first)
              const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
              const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
              return dateB - dateA;
            }),
          }))
          .sort((a, b) => a.companyName.localeCompare(b.companyName));

        setCompanyGroups(groups);
      }
    } catch (err) {
      console.error("Failed to load previous tasks:", err);
    }
  }

  function toggleCompany(companyName: string) {
    setExpandedCompanies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(companyName)) {
        newSet.delete(companyName);
      } else {
        newSet.add(companyName);
      }
      return newSet;
    });
  }

  async function loadMessages(taskId: string) {
    try {
      const res = await apiGet<{ success: boolean; data: TaskChatMessage[] }>(
        `/task-chat/${taskId}`
      );
      if (res.success) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function sendMessage() {
    if (!selectedTaskId || !newMessage.trim()) return;

    try {
      setSending(true);
      await apiPost(`/task-chat/${selectedTaskId}`, {
        text: newMessage.trim(),
      });
      setNewMessage("");
      await loadMessages(selectedTaskId);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const selectedTask = tasks.find((t) => t._id === selectedTaskId) || previousTasks.find((t) => t._id === selectedTaskId);
  const isCompletedTask = selectedTask && (selectedTask.status === "completed" || selectedTask.status === "cancelled");

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading messages…</div>
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
            <div className="browse-eyebrow">Messages</div>
            <h1 className="browse-title">Chat with employers about your active tasks</h1>
            <p className="browse-subtitle">Communicate with employers for your running jobs</p>
      </div>
        </header>

      {tasks.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No Active Tasks</div>
              <div className="browse-empty-sub">
            You need to have an accepted application to start chatting.
        </div>
            </div>
          </section>
        ) : (
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", height: "600px" }}>
            {/* Task List */}
            <div className="browse-panel" style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "800", margin: 0 }}>Active Tasks</h2>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
              {tasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "16px",
                      borderBottom: "1px solid var(--border)",
                      background: selectedTaskId === task._id ? "rgba(255,255,255,.08)" : "transparent",
                      border: "none",
                      color: "var(--text)",
                      cursor: "pointer",
                      transition: "background 160ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "rgba(255,255,255,.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>{task.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{task.companyName}</div>
                  </button>
                ))}

                {/* Previous Tasks Section */}
                {companyGroups.length > 0 && (
                  <>
                    <div style={{ padding: "16px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginTop: "8px" }}>
                      <h2 style={{ fontSize: "14px", fontWeight: "800", margin: 0, color: "var(--muted)" }}>Previous Tasks</h2>
                    </div>
                    {companyGroups.map((group) => {
                      const isExpanded = expandedCompanies.has(group.companyName);
                      return (
                        <div key={group.companyName} style={{ borderBottom: "1px solid var(--border)" }}>
                          <button
                            onClick={() => toggleCompany(group.companyName)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "16px",
                              background: "transparent",
                              border: "none",
                              color: "var(--text)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "background 160ms ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,.04)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "2px" }}>{group.companyName}</div>
                              <div style={{ fontSize: "11px", color: "var(--muted)" }}>{group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}</div>
                            </div>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              style={{
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 200ms ease",
                                color: "var(--muted)",
                              }}
                >
                              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          {isExpanded && (
                            <div>
                              {group.tasks.map((task) => (
                                <button
                                  key={task._id}
                                  onClick={() => setSelectedTaskId(task._id)}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "12px 16px 12px 32px",
                                    borderTop: "1px solid var(--border)",
                                    background: selectedTaskId === task._id ? "rgba(255,255,255,.08)" : "transparent",
                                    borderLeft: "none",
                                    borderRight: "none",
                                    borderBottom: "none",
                                    color: "var(--text)",
                                    cursor: "pointer",
                                    transition: "background 160ms ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (selectedTaskId !== task._id) {
                                      e.currentTarget.style.background = "rgba(255,255,255,.04)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (selectedTaskId !== task._id) {
                                      e.currentTarget.style.background = "transparent";
                                    }
                                  }}
                                >
                                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{task.title}</div>
                                  <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", gap: "8px", alignItems: "center" }}>
                                    <span style={{
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontSize: "10px",
                                      background: task.status === "completed" ? "rgba(34,197,94,.16)" : "rgba(239,68,68,.16)",
                                      color: task.status === "completed" ? "rgba(34,197,94,.9)" : "rgba(239,68,68,.9)",
                                    }}>
                                      {task.status}
                                    </span>
                                    {task.completionDate && (
                                      <span>{new Date(task.completionDate).toLocaleDateString()}</span>
                                    )}
                                  </div>
                </button>
              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
            </div>
          </div>

          {/* Chat Area */}
            <div className="browse-panel" style={{ margin: 0, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selectedTask ? (
              <>
                {/* Chat Header */}
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "4px" }}>{selectedTask.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)" }}>{selectedTask.companyName}</div>
                </div>

                {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {messages.length === 0 ? (
                      <div style={{ textAlign: "center", fontSize: "13px", color: "var(--muted)", padding: "32px 0" }}>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId._id === user?.id;
                      return (
                        <div
                          key={msg._id}
                            style={{ display: "flex", gap: "12px", flexDirection: isOwn ? "row-reverse" : "row" }}
                        >
                            <div style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "rgba(124,58,237,.3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}>
                            {msg.senderId.name.charAt(0).toUpperCase()}
                          </div>
                            <div style={{ flex: 1, textAlign: isOwn ? "right" : "left" }}>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                              {msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                            <div
                                style={{
                                  display: "inline-block",
                                  padding: "10px 14px",
                                  borderRadius: "14px",
                                  fontSize: "13px",
                                  background: isOwn
                                    ? "linear-gradient(135deg, var(--primary), var(--blue))"
                                    : "rgba(255,255,255,.08)",
                                  color: isOwn ? "white" : "var(--text)",
                                  border: isOwn ? "none" : "1px solid var(--border)",
                                }}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                  {isCompletedTask ? (
                    <div style={{ padding: "16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                      <div style={{ fontSize: "12px", color: "var(--muted)", padding: "8px" }}>
                        This task is {selectedTask?.status}. Messages are read-only.
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                        style={{ display: "flex", gap: "8px" }}
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                          className="browse-input"
                          style={{ flex: 1 }}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                          className="browse-btn browse-btn--primary"
                          style={{ opacity: (!newMessage.trim() || sending) ? 0.5 : 1 }}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </form>
                </div>
                  )}
              </>
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "13px", color: "var(--muted)" }}>
                Select a task to view messages
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
