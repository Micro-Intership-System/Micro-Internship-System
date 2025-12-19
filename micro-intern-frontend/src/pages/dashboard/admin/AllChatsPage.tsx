import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const taskIdFromQuery = searchParams.get("taskId");
    if (taskIdFromQuery) {
      if (tasks.length > 0) {
        const taskExists = tasks.find(t => t._id === taskIdFromQuery);
        if (taskExists) {
          setSelectedTaskId(taskIdFromQuery);
        }
      } else {
        // Set it immediately if tasks haven't loaded yet
        setSelectedTaskId(taskIdFromQuery);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadTasks() {
    try {
      setLoading(true);
      const res = await apiGet<{ success: boolean; data: Task[] }>("/internships");
      if (res.success) {
        const activeTasks = res.data.filter(
          (task: any) => task.acceptedStudentId && (
            task.status === "in_progress" || 
            task.status === "posted" || 
            task.submissionStatus === "disputed"
          )
        );
        setTasks(activeTasks);
        
        // Check if there's a taskId in query params
        const taskIdFromQuery = searchParams.get("taskId");
        if (taskIdFromQuery) {
          const taskExists = activeTasks.find(t => t._id === taskIdFromQuery);
          if (taskExists) {
            setSelectedTaskId(taskIdFromQuery);
          } else if (activeTasks.length > 0) {
            setSelectedTaskId(activeTasks[0]._id);
          }
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
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
            <div className="browse-eyebrow">Chat Monitoring</div>
            <h1 className="browse-title">All Chats</h1>
            <p className="browse-subtitle">
              Monitor all active task conversations between students and employers. Admin access to all chats for moderation.
            </p>
          </div>
          <div className="browse-actions">
            <div className="browse-stat">
              <div className="browse-stat-label">Active Chats</div>
              <div className="browse-stat-value">{tasks.length}</div>
            </div>
          </div>
        </header>

        {tasks.length === 0 ? (
          <section className="browse-panel" style={{ marginTop: "16px" }}>
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              No active chats found
            </div>
          </section>
        ) : (
          <section className="browse-panel" style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "300px 1fr", gap: "12px", height: "600px", overflow: "hidden" }}>
            {/* Task List */}
            <div className="browse-panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
              <div style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="browse-input"
                  style={{ fontSize: "12px", padding: "8px 12px" }}
                />
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredTasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px",
                      borderBottom: "1px solid var(--border)",
                      background: selectedTaskId === task._id ? "rgba(255,255,255,.08)" : "transparent",
                      transition: "background 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "rgba(255,255,255,.03)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTaskId !== task._id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: "13px", marginBottom: "4px" }}>{task.title}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{task.companyName}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="browse-panel" style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
              {selectedTask ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "8px" }}>{selectedTask.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>Company: {selectedTask.companyName}</div>
                      <div>Employer: {selectedTask.employerId.name}</div>
                      {selectedTask.acceptedStudentId && (
                        <div>Student: {selectedTask.acceptedStudentId.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", padding: "40px 20px" }}>
                        No messages yet
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isAdmin = msg.senderId._id === user?.id;
                        return (
                          <div key={msg._id} style={{ display: "flex", gap: "12px", flexDirection: isAdmin ? "row-reverse" : "row" }}>
                            <div style={{ 
                              width: "32px", 
                              height: "32px", 
                              borderRadius: "50%", 
                              background: isAdmin ? "rgba(34,197,94,.8)" : "var(--primary)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              color: "white", 
                              fontSize: "12px", 
                              fontWeight: 800, 
                              flexShrink: 0 
                            }}>
                              {msg.senderId.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                              <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                                {isAdmin && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(34,197,94,.2)", color: "#22c55e", fontWeight: 800 }}>ADMIN</span>}
                                <span>{msg.senderId.name} · {new Date(msg.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <div style={{ 
                                display: "inline-block", 
                                padding: "10px 14px", 
                                borderRadius: "12px", 
                                fontSize: "13px", 
                                background: isAdmin ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.08)", 
                                border: isAdmin ? "1px solid rgba(34,197,94,.3)" : "1px solid var(--border)",
                                maxWidth: "70%"
                              }}>
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
                        style={{ flex: 1, fontSize: "13px", padding: "10px 14px" }}
                        disabled={sending || !selectedTaskId}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending || !selectedTaskId}
                        className="browse-btn browse-btn--primary"
                        style={{ fontSize: "13px", padding: "10px 20px", whiteSpace: "nowrap" }}
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", fontSize: "13px" }}>
                  Select a task to view messages
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
