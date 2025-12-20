import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import "../student/css/BrowsePage.css";

type Task = {
  _id: string;
  title: string;
  companyName: string;
  status: string;
  employerId: { _id: string; name: string; email: string };
  acceptedStudentId?: { _id: string; name: string; email: string };
};

type ChatMessage = {
  _id: string;
  taskId: string;
  senderId: { _id: string; name: string; email: string };
  text: string;
  createdAt: string;
  status: string;
};

export default function AllChatsPage() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    if (taskIdParam && tasks.length > 0) {
      const taskExists = tasks.find((t) => t._id === taskIdParam);
      if (taskExists) {
        setSelectedTaskId(taskIdParam);
      }
    }
  }, [searchParams, tasks]);

  useEffect(() => {
    if (selectedTaskId) {
      loadMessages(selectedTaskId);
      const interval = setInterval(() => {
        loadMessages(selectedTaskId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTaskId]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Task[] }>("/internships");
      if (res.success) {
        // Include all tasks with accepted students (including disputed ones)
        const activeTasks = res.data.filter(
          (task: any) => task.acceptedStudentId && (task.status === "in_progress" || task.status === "posted" || task.submissionStatus === "disputed")
        );
        setTasks(activeTasks);
        
        const taskIdParam = searchParams.get("taskId");
        if (taskIdParam && activeTasks.find((t: any) => t._id === taskIdParam)) {
          setSelectedTaskId(taskIdParam);
        } else if (activeTasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(activeTasks[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(taskId: string) {
    try {
      const res = await apiGet<{ success: boolean; data: ChatMessage[] }>(`/task-chat/${taskId}`);
      if (res.success) {
        setMessages(res.data || []);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function sendMessage() {
    if (!selectedTaskId || !newMessage.trim()) return;

    try {
      setSending(true);
      await apiPost(`/task-chat/${selectedTaskId}`, { text: newMessage.trim() });
      setNewMessage("");
      await loadMessages(selectedTaskId);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  if (loading) {
    return (
      <div className="browse-page">
        <div className="browse-inner">
          <div className="browse-loading">Loading chats…</div>
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
            <h1 className="browse-title">All Chats</h1>
            <p className="browse-subtitle">Monitor all active task conversations between students and employers</p>
          </div>
        </header>

        {tasks.length === 0 ? (
          <section className="browse-results" style={{ marginTop: "16px" }}>
            <div className="browse-empty">
              <div className="browse-empty-title">No active chats found</div>
            </div>
          </section>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px", marginTop: "16px", height: "600px" }}>
            {/* Task List */}
            <section className="browse-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="browse-input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                {filteredTasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px",
                      marginBottom: "8px",
                      background: selectedTaskId === task._id ? "rgba(255,255,255,.1)" : "transparent",
                      border: `1px solid ${selectedTaskId === task._id ? "var(--primary)" : "var(--border)"}`,
                      borderRadius: "var(--r-md)",
                      color: "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "rgba(255,255,255,.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div className="job-title" style={{ fontSize: "14px", marginBottom: "4px" }}>
                      {task.title}
                    </div>
                    <div className="job-sub" style={{ fontSize: "12px" }}>
                      {task.companyName}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Chat Area */}
            <section className="browse-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {selectedTask ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div className="job-title" style={{ fontSize: "16px", marginBottom: "8px" }}>
                      {selectedTask.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>Company: {selectedTask.companyName}</div>
                      <div>Employer: {selectedTask.employerId.name}</div>
                      {selectedTask.acceptedStudentId && (
                        <div>Student: {selectedTask.acceptedStudentId.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
                        No messages yet
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg._id} style={{ display: "flex", gap: "12px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, rgba(124,58,237,.5), rgba(59,130,246,.4))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                              flexShrink: 0,
                            }}
                          >
                            {msg.senderId.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                              {msg.senderId.name} · {new Date(msg.createdAt).toLocaleTimeString()}
                            </div>
                            <div
                              style={{
                                display: "inline-block",
                                padding: "10px 14px",
                                borderRadius: "var(--r-md)",
                                background: "rgba(255,255,255,.08)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                fontSize: "14px",
                                lineHeight: "1.5",
                              }}
                            >
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="browse-input"
                      style={{ flex: 1 }}
                      disabled={sending}
                    />
                    <button
                      onClick={sendMessage}
                      className="browse-btn browse-btn--primary"
                      disabled={!newMessage.trim() || sending}
                      style={{ opacity: (!newMessage.trim() || sending) ? 0.5 : 1 }}
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
                  Select a task to view messages
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
